import { Request, Response, NextFunction } from "express";
import { ingestEvent } from "./event.controller";
import { db } from "../db";
import { redis } from "../redis";
import { enqueueEvent } from "../queues/event.queue";
import { checkIngestRateLimit } from "../utils/ingestRateLimit";
import { checkFingerprintRateLimit } from "../utils/fingerprintRateLimit";

jest.mock("../db", () => ({
  db: { query: jest.fn() },
}));

jest.mock("../redis", () => ({
  redis: {
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../queues/event.queue", () => ({
  enqueueEvent: jest.fn(),
}));

jest.mock("../utils/apiKey", () => ({
  hashApiKey: jest.fn().mockReturnValue("hashed-key"),
}));

jest.mock("../utils/ingestRateLimit", () => ({
  checkIngestRateLimit: jest.fn(),
}));

jest.mock("../utils/fingerprintRateLimit", () => ({
  checkFingerprintRateLimit: jest.fn(),
  recordSuppressedDuplicate: jest.fn(),
}));

describe("Event ingestion idempotency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.query as jest.Mock).mockReset();

    (checkIngestRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
    });

    (checkFingerprintRateLimit as jest.Mock).mockResolvedValue(true);

    (db.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: "project-1" }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: "service-1" }],
      });

    (redis.set as jest.Mock).mockResolvedValue(null);
  });

  it("should ignore an event that has already been received", async () => {
    const req = {
      header: jest.fn().mockReturnValue("test-api-key"),
      body: {
        eventId: "evt-duplicate-001",
        service: "payment-service",
        environment: "production",
        level: "ERROR",
        message: "Payment failed",
        timestamp: "2026-11-16T10:00:00Z",
      },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await ingestEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);

    expect(res.json).toHaveBeenCalledWith({
      message: "Event already received",
    });

    expect(enqueueEvent).not.toHaveBeenCalled();

    expect(next).not.toHaveBeenCalled();
  });

  it("should accept and queue a new event", async () => {
    (redis.set as jest.Mock).mockResolvedValue("OK");
    (enqueueEvent as jest.Mock).mockResolvedValue(true);

    const req = {
      header: jest.fn().mockReturnValue("test-api-key"),
      body: {
        eventId: "evt-new-001",
        service: "payment-service",
        environment: "production",
        level: "ERROR",
        message: "Payment failed",
        endpoint: "/api/payments",
        timestamp: "2026-11-16T10:00:00Z",
      },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await ingestEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);

    expect(res.json).toHaveBeenCalledWith({
      message: "Event accepted for processing",
    });

    expect(enqueueEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-new-001",
        service: "payment-service",
        serviceId: "service-1",
        projectId: "project-1",
      })
    );

    expect(redis.del).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an event without an eventId", async () => {
    const req = {
      header: jest.fn().mockReturnValue("test-api-key"),
      body: {
        service: "payment-service",
        environment: "production",
        level: "ERROR",
        message: "Payment failed",
        timestamp: "2026-11-16T10:00:00Z",
      },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await ingestEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(enqueueEvent).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should release the idempotency key when the queue is full", async () => {
    (redis.set as jest.Mock).mockResolvedValue("OK");
    (redis.del as jest.Mock).mockResolvedValue(1);
    (enqueueEvent as jest.Mock).mockResolvedValue(false);

    const req = {
      header: jest.fn().mockReturnValue("test-api-key"),
      body: {
        eventId: "evt-queue-full-001",
        service: "payment-service",
        environment: "production",
        level: "ERROR",
        message: "Payment failed",
        timestamp: "2026-11-16T10:00:00Z",
      },
    } as unknown as Request;

    const res = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await ingestEvent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(redis.del).toHaveBeenCalledWith(
      "incidentflow:event:service-1:evt-queue-full-001"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should release the idempotency key when queueing throws an error", async () => {
    (redis.set as jest.Mock).mockResolvedValue("OK");
    (redis.del as jest.Mock).mockResolvedValue(1);

    const error = new Error("Redis queue error");
    (enqueueEvent as jest.Mock).mockRejectedValue(error);

    const req = {
      header: jest.fn().mockReturnValue("test-api-key"),
      body: {
        eventId: "evt-queue-error-001",
        service: "payment-service",
        environment: "production",
        level: "ERROR",
        message: "Payment failed",
        timestamp: "2026-11-16T10:00:00Z",
      },
    } as unknown as Request;

    const res = {
      setHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await ingestEvent(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(redis.del).toHaveBeenCalledWith(
      "incidentflow:event:service-1:evt-queue-error-001"
    );
  });
});
