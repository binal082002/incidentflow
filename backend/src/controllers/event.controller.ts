import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { IncidentEvent } from "../types";
import { enqueueEvent } from "../queues/event.queue";
import { hashApiKey } from "../utils/apiKey";

export const ingestEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.header("X-IncidentFlow-Key");

    if (!apiKey) {
      res.status(401).json({
        message: "Ingest API key is required",
      });
      return;
    }

    const apiKeyHash = hashApiKey(apiKey);

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

    const { service, environment, level, message, endpoint, timestamp } =
      req.body as IncidentEvent;

    if (!service || !environment || !level || !message || !timestamp) {
      res.status(400).json({
        error:
          "service, environment, level, message and timestamp are required",
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

    await enqueueEvent({
      service,
      serviceId,
      projectId,
      environment,
      level,
      message,
      endpoint,
      timestamp,
    });

    res.status(202).json({
      message: "Event accepted for processing",
    });
  } catch (error) {
    next(error);
  }
};
