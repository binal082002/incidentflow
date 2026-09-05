import { Request, Response, NextFunction } from "express";
import { db } from "../db";

export const getIncidentsByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `
      SELECT
        i.id,
        i.title,
        i.severity,
        i.severity_reasons,
        i.status,
        i.event_count,
        i.started_at,
        i.last_seen_at,
        s.name AS service_name
      FROM incidents i
      JOIN services s
        ON s.id = i.service_id
      WHERE s.project_id = $1
      ORDER BY i.created_at DESC
      `,
      [projectId]
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { incidentId } = req.params;

    const incidentResult = await db.query(
      `
      SELECT
        i.*,
        s.name AS service_name,
        s.project_id
      FROM incidents i
      JOIN services s
        ON s.id = i.service_id
      WHERE i.id = $1
      `,
      [incidentId]
    );

    if (incidentResult.rowCount === 0) {
      res.status(404).json({
        error: "Incident not found",
      });
      return;
    }

    const eventsResult = await db.query(
      `
      SELECT
        id,
        environment,
        level,
        message,
        endpoint,
        occurred_at
      FROM events
      WHERE incident_id = $1
      ORDER BY occurred_at DESC
      `,
      [incidentId]
    );

    const timelineResult = await db.query(
      `
        SELECT
          id,
          type,
          message,
          created_at
        FROM incident_timeline
        WHERE incident_id = $1
        ORDER BY created_at ASC
        `,
      [incidentId]
    );

    res.status(200).json({
      data: {
        ...incidentResult.rows[0],
        events: eventsResult.rows,
        timeline: timelineResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeIncident = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { incidentId } = req.params;

    const result = await db.query(
      `
        UPDATE incidents
        SET status = 'acknowledged'
        WHERE id = $1
          AND status = 'open'
        RETURNING *
        `,
      [incidentId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        error: "Incident not found or already resolved",
      });
      return;
    }

    await db.query(
      `
        INSERT INTO incident_timeline (
          incident_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
        `,
      [incidentId, "acknowledged", "Incident acknowledged"]
    );

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const resolveIncident = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { incidentId } = req.params;

    const result = await db.query(
      `
        UPDATE incidents
        SET
          status = 'resolved',
          resolved_at = NOW()
        WHERE id = $1
          AND status != 'resolved'
        RETURNING *
        `,
      [incidentId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        error: "Incident not found or already resolved",
      });
      return;
    }

    await db.query(
      `
        INSERT INTO incident_timeline (
          incident_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
        `,
      [incidentId, "resolved", "Incident resolved"]
    );

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
