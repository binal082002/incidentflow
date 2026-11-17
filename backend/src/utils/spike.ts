import { RedisClientType } from "redis";

const WINDOW_SECONDS = 60;

interface SpikeResult {
  isSpike: boolean;
  spikeStarted: boolean;
  count: number;
}

export const trackAndDetectSpike = async (
  redisClient: RedisClientType,
  projectId: string,
  fingerprint: string
): Promise<SpikeResult> => {
  const key = `spike:${projectId}:${fingerprint}`;

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }

  return {
    count,
    isSpike: count >= 5,
    spikeStarted: count === 5,
  };
};
