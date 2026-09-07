import { redis } from "../redis";

const LIMIT = 10;
const WINDOW_SECONDS = 1;
export const SUPPRESSED_FLUSH_QUEUE = "incidentflow:suppressed-flush";

export const checkFingerprintRateLimit = async (
  projectId: string,
  fingerprint: string
): Promise<boolean> => {
  const key = `rate-limit:fingerprint:${projectId}:${fingerprint}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  return count <= LIMIT;
};

export const recordSuppressedDuplicate = async (
  projectId: string,
  fingerprint: string
): Promise<number> => {
  const key = `suppressed:fingerprint:${projectId}:${fingerprint}`;

  const count = await redis.incr(key);

  // Keep the counter alive while the error storm is still happening.
  await redis.expire(key, 60);

  // Schedule the flush for ~1.5 seconds after the latest duplicate.
  await redis.zAdd(SUPPRESSED_FLUSH_QUEUE, [
    {
      score: Date.now() + 1500,
      value: `${projectId}:${fingerprint}`,
    },
  ]);

  return count;
};

export const consumeSuppressedDuplicates = async (
  redisClient: any,
  projectId: string,
  fingerprint: string
): Promise<number> => {
  const key = `suppressed:fingerprint:${projectId}:${fingerprint}`;

  const value = await redisClient.getDel(key);

  return value ? Number(value) : 0;
};

export const getDueSuppressedFlushes = async (
  redisClient: any
): Promise<string[]> => {
  const now = Date.now();

  const items = await redisClient.zRangeByScore(SUPPRESSED_FLUSH_QUEUE, 0, now);

  if (items.length > 0) {
    await redisClient.zRem(SUPPRESSED_FLUSH_QUEUE, items);
  }

  return items;
};
