import app from "./app";
import config from "./config";
import { db } from "./db";
import { redis } from "./redis";
import { createServer } from "http";
import { initializeSocket } from "./socket";
import { startRealtimeSubscriber } from "./realtime";

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    await db.query("SELECT 1");
    console.log("PostgreSQL connected");

    await redis.connect();
    console.log("Redis connected");

    const httpServer = createServer(app);

    initializeSocket(httpServer);
    await startRealtimeSubscriber();

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
};

startServer();
