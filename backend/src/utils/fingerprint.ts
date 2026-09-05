import crypto from "crypto";

export const normalizeMessage = (message: string): string => {
  return message
    .toLowerCase()
    .replace(/\b\d+\b/g, "<number>")
    .replace(/\s+/g, " ")
    .trim();
};

export const generateFingerprint = (
  service: string,
  endpoint: string | undefined,
  message: string
): string => {
  const normalizedMessage = normalizeMessage(message);

  const source = [
    service,
    endpoint || "",
    normalizedMessage,
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(source)
    .digest("hex");
};