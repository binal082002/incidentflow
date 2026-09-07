import { redis } from "../redis";
import { IncidentEvent } from "../types";

const EVENT_QUEUE = "incidentflow:events";
export const MAX_QUEUE_SIZE = 1000;

export const isEventQueueFull = async (
  queueKey: string = EVENT_QUEUE,
  maxSize: number = MAX_QUEUE_SIZE
): Promise<boolean> => {
  const queueLength = await redis.lLen(queueKey);

  return queueLength >= maxSize;
};

export const enqueueEvent = async (
  event: IncidentEvent & {
    serviceId: string;
    projectId: string;
  }
): Promise<boolean> => {
  if (await isEventQueueFull()) {
    return false;
  }

  await redis.rPush(EVENT_QUEUE, JSON.stringify(event));

  return true;
};
