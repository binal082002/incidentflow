import { Response, NextFunction } from "express";

import { db } from "../db";
import { AuthenticatedRequest } from "./auth.middleware";

export const requireIncidentOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { incidentId } = req.params;

    if (!incidentId) {
      res.status(400).json({
        message: "Incident ID is required",
      });
      return;
    }

    const result = await db.query(
      `
      SELECT i.id
      FROM incidents i
      JOIN services s
        ON s.id = i.service_id
      JOIN projects p
        ON p.id = s.project_id
      WHERE i.id = $1
        AND p.owner_id = $2
      LIMIT 1
      `,
      [incidentId, req.user.userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Incident not found",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
