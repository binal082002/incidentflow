import { Response, NextFunction } from "express";

import { db } from "../db";
import { AuthenticatedRequest } from "./auth.middleware";

export const requireProjectOwner = async (
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

    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({
        message: "Project ID is required",
      });
      return;
    }

    const result = await db.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1
        AND owner_id = $2
      LIMIT 1
      `,
      [projectId, req.user.userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
