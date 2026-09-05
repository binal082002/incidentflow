import dotenv from "dotenv";

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 5000,

  database: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "incidentflow",
  },

  redis: {
    url: process.env.REDIS_URL || "",
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export default config;
