import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { generateProjectApiKey, hashApiKey } from "../utils/apiKey";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const createProject = async (
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

    const userId = req.user.userId;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        message: "Project name is required",
      });
      return;
    }

    // Generate the raw key that will be shown to the user
    const apiKey = generateProjectApiKey();

    // Store only the hash in PostgreSQL
    const apiKeyHash = hashApiKey(apiKey);

    const result = await db.query(
      `
      INSERT INTO projects (
        name,
        ingest_key_hash,
        owner_id
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        created_at
      `,
      [name, apiKeyHash, userId]
    );

    res.status(201).json({
      data: result.rows[0],

      // Raw API key is returned only here
      api_key: apiKey,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
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

    const userId = req.user.userId;
    const result = await db.query(
      `
      SELECT
        id,
        name,
        created_at
      FROM projects
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
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
    const userId = req.user.userId;

    const result = await db.query(
      `
      SELECT
      id,
      name,
      created_at,
      (ingest_key_hash IS NOT NULL) AS has_ingest_key
    FROM projects
      WHERE id = $1
        AND owner_id = $2
      LIMIT 1
      `,
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateProjectApiKey = async (
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

    const apiKey = generateProjectApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const result = await db.query(
      `
      UPDATE projects
      SET ingest_key_hash = $1
      WHERE id = $2
        AND owner_id = $3
      RETURNING
        id,
        name
      `,
      [apiKeyHash, projectId, req.user.userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      message: "Ingest API key regenerated successfully",
      api_key: apiKey,
    });
  } catch (error) {
    next(error);
  }
};
