import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const createService = async (
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

    const { projectId, name } = req.body;

    const projectResult = await db.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1
        AND owner_id = $2
      LIMIT 1
      `,
      [projectId, req.user.userId]
    );

    if (projectResult.rowCount === 0) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({
        error: "projectId is required",
      });
      return;
    }

    if (!name || typeof name !== "string") {
      res.status(400).json({
        error: "Service name is required",
      });
      return;
    }

    const result = await db.query(
      `
      INSERT INTO services (project_id, name)
      VALUES ($1, $2)
      RETURNING *
      `,
      [projectId, name.trim()]
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getServicesByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `
      SELECT *
      FROM services
      WHERE project_id = $1
      ORDER BY created_at DESC
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
