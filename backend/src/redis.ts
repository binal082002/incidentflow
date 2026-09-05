import { createClient } from "redis";
import config from "./config";

export const redis = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});