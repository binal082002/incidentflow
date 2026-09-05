import { redis } from "./redis";
import { getSocket } from "./socket";

const INCIDENT_UPDATE_CHANNEL = "incidentflow:incident-updates";

export const startRealtimeSubscriber = async (): Promise<void> => {
  // A Redis connection that is subscribed cannot be used
  // for normal Redis commands, so we create a separate connection.
  const subscriber = redis.duplicate();

  subscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
  });

  await subscriber.connect();

  await subscriber.subscribe(INCIDENT_UPDATE_CHANNEL, (message) => {
    try {
      const data = JSON.parse(message);

      console.log("Realtime incident update received:", data);

      getSocket().to(`project:${data.projectId}`).emit("incident:update", data);
    } catch (error) {
      console.error("Invalid realtime message:", error);
    }
  });

  console.log("Realtime Redis subscriber started");
};
