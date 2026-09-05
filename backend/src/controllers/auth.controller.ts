import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

import { db } from "../db";
import { generateToken } from "../utils/jwt";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      res.status(409).json({
        message: "User already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
      INSERT INTO users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING
        id,
        email,
        created_at
      `,
      [normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await db.query(
      `
        SELECT
          id,
          email,
          password_hash,
          created_at
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
