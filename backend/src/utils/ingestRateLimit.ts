import { redis } from "../redis";

const LIMIT = 50;
const WINDOW_SECONDS = 1;

export const checkIngestRateLimit = async (
  apiKeyHash: string
): Promise<{
  allowed: boolean;
  remaining: number;
}> => {
  const key = `rate-limit:ingest:${apiKeyHash}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  return {
    allowed: count <= LIMIT,
    remaining: Math.max(LIMIT - count, 0),
  };
};
