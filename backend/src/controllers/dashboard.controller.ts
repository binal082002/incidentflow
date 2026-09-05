import { Request, Response, NextFunction } from "express";
import { db } from "../db";

const projectExists = async (projectId: string): Promise<boolean> => {
  const result = await db.query(
    `
      SELECT id
      FROM projects
      WHERE id = $1
      LIMIT 1
      `,
    [projectId]
  );

  return result.rowCount === 1;
};

export const getProjectDashboard = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const exists = await projectExists(projectId);

    if (!exists) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    const result = await db.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE i.status IN ('open', 'acknowledged')
        )::int AS active_incidents,

        COUNT(*) FILTER (
          WHERE i.severity = 'critical'
          AND i.status IN ('open', 'acknowledged')
        )::int AS critical_incidents,

        COUNT(*) FILTER (
          WHERE i.severity = 'high'
          AND i.status IN ('open', 'acknowledged')
        )::int AS high_incidents,

        COUNT(*) FILTER (
          WHERE i.status = 'acknowledged'
        )::int AS acknowledged_incidents,

        COUNT(*) FILTER (
          WHERE i.status = 'resolved'
        )::int AS resolved_incidents

      FROM incidents i
      JOIN services s
        ON s.id = i.service_id

      WHERE s.project_id = $1
      `,
      [projectId]
    );

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectServiceHealth = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const exists = await projectExists(projectId);

    if (!exists) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    const result = await db.query(
      `
        SELECT
          s.id,
          s.name,
  
          COUNT(i.id) FILTER (
            WHERE i.status IN ('open', 'acknowledged')
          )::int AS active_incidents,
  
          CASE
            WHEN COUNT(i.id) FILTER (
              WHERE i.status IN ('open', 'acknowledged')
                AND i.severity = 'critical'
            ) > 0 THEN 'critical'
  
            WHEN COUNT(i.id) FILTER (
              WHERE i.status IN ('open', 'acknowledged')
                AND i.severity = 'high'
            ) > 0 THEN 'high'
  
            WHEN COUNT(i.id) FILTER (
              WHERE i.status IN ('open', 'acknowledged')
                AND i.severity = 'medium'
            ) > 0 THEN 'medium'
  
            WHEN COUNT(i.id) FILTER (
              WHERE i.status IN ('open', 'acknowledged')
                AND i.severity = 'low'
            ) > 0 THEN 'low'
  
            ELSE 'healthy'
          END AS health
  
        FROM services s
  
        LEFT JOIN incidents i
          ON i.service_id = s.id
  
        WHERE s.project_id = $1
  
        GROUP BY s.id, s.name
  
        ORDER BY s.name
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

export const getRecentProjectIncidents = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const exists = await projectExists(projectId);

    if (!exists) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    const result = await db.query(
      `
        SELECT
          i.id,
          i.title,
          i.severity,
          i.status,
          i.event_count,
          i.last_seen_at,
          s.name AS service_name
  
        FROM incidents i
  
        JOIN services s
          ON s.id = i.service_id
  
        WHERE s.project_id = $1
  
        ORDER BY i.last_seen_at DESC
  
        LIMIT 5
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
