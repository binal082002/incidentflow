import { redis } from "../redis";
import { IncidentEvent } from "../types";

const EVENT_QUEUE = "incidentflow:events";

export const enqueueEvent = async (
  event: IncidentEvent & {
    serviceId: string;
    projectId: string;
  }
): Promise<void> => {
  await redis.rPush(EVENT_QUEUE, JSON.stringify(event));
};
