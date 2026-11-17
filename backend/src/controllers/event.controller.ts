import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { IncidentEvent } from "../types";
import { enqueueEvent } from "../queues/event.queue";
import { hashApiKey } from "../utils/apiKey";
import { checkIngestRateLimit } from "../utils/ingestRateLimit";
import { generateFingerprint } from "../utils/fingerprint";
import {
  checkFingerprintRateLimit,
  recordSuppressedDuplicate,
} from "../utils/fingerprintRateLimit";
import { redis } from "../redis";

export const ingestEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let idempotencyKey: string | undefined;
  let keepIdempotencyKey = false;
  let idempotencyKeyReserved = false;

  try {
    const apiKey = req.header("X-IncidentFlow-Key");

    if (!apiKey) {
      res.status(401).json({
        message: "Ingest API key is required",
      });
      return;
    }

    const apiKeyHash = hashApiKey(apiKey);

    const rateLimit = await checkIngestRateLimit(apiKeyHash);

    if (!rateLimit.allowed) {
      res.setHeader("Retry-After", "1");

      res.status(429).json({
        message: "Ingest rate limit exceeded",
        retryAfter: 1,
      });

      return;
    }

    const projectResult = await db.query(
      `
        SELECT id
        FROM projects
        WHERE ingest_key_hash = $1
        LIMIT 1
        `,
      [apiKeyHash]
    );

    if (projectResult.rowCount === 0) {
      res.status(401).json({
        message: "Invalid ingest API key",
      });
      return;
    }

    const projectId = projectResult.rows[0].id;

    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      res.status(400).json({
        error: "Request body must be a valid JSON object",
      });
      return;
    }

    const {
      eventId,
      service,
      environment,
      level,
      message,
      endpoint,
      timestamp,
    } = body as Partial<IncidentEvent>;

    if (
      typeof eventId !== "string" ||
      !eventId.trim() ||
      typeof service !== "string" ||
      !service.trim() ||
      typeof environment !== "string" ||
      !["development", "staging", "production"].includes(environment) ||
      typeof level !== "string" ||
      !["INFO", "WARN", "ERROR", "FATAL"].includes(level) ||
      typeof message !== "string" ||
      !message.trim() ||
      typeof timestamp !== "string" ||
      !Number.isFinite(Date.parse(timestamp)) ||
      (endpoint !== undefined && typeof endpoint !== "string")
    ) {
      res.status(400).json({
        error: "Invalid event payload",
      });
      return;
    }

    const serviceResult = await db.query(
      `
      SELECT id
      FROM services
      WHERE project_id = $1
        AND name = $2
      LIMIT 1
      `,
      [projectId, service]
    );

    if (serviceResult.rowCount === 0) {
      res.status(404).json({
        error: "Service not found",
      });
      return;
    }

    const serviceId = serviceResult.rows[0].id;

    idempotencyKey = `incidentflow:event:${serviceId}:${eventId}`;

    const isNewEvent = await redis.set(idempotencyKey, "1", {
      NX: true,
      EX: 86400,
    });

    if (isNewEvent !== "OK") {
      res.status(202).json({
        message: "Event already received",
      });
      return;
    }

    idempotencyKeyReserved = true;

    const fingerprint = generateFingerprint(service, endpoint, message);

    const fingerprintAllowed = await checkFingerprintRateLimit(
      projectId,
      fingerprint
    );

    if (!fingerprintAllowed) {
      const suppressedCount = await recordSuppressedDuplicate(
        projectId,
        fingerprint
      );

      keepIdempotencyKey = true;

      res.status(202).json({
        message: "Duplicate event suppressed",
        suppressedCount,
      });

      return;
    }

    const queued = await enqueueEvent({
      eventId,
      service,
      serviceId,
      projectId,
      environment,
      level,
      message,
      endpoint,
      timestamp,
    });

    if (!queued) {
      res.setHeader("Retry-After", "2");

      res.status(503).json({
        message: "Event queue is temporarily full",
        retryAfter: 2,
      });

      return;
    }

    keepIdempotencyKey = true;

    res.status(202).json({
      message: "Event accepted for processing",
    });
  } catch (error) {
    next(error);
  } finally {
    if (idempotencyKeyReserved && !keepIdempotencyKey && idempotencyKey) {
      await redis.del(idempotencyKey).catch((cleanupError) => {
        console.error("Failed to release event idempotency key:", cleanupError);
      });
    }
  }
};
