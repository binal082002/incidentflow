import crypto from "crypto";

export const generateProjectApiKey = (): string => {
  const randomPart = crypto.randomBytes(24).toString("hex");

  return `if_proj_${randomPart}`;
};

export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};
