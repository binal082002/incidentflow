import { Environment, EventLevel } from "../types";

export type Severity = "low" | "medium" | "high" | "critical";

interface SeverityInput {
  environment: Environment;
  level: EventLevel;
  eventCount: number;
  isSpike?: boolean;
}

interface SeverityResult {
  severity: Severity;
  reasons: string[];
}

export const calculateSeverity = ({
  environment,
  level,
  eventCount,
  isSpike = false,
}: SeverityInput): SeverityResult => {
  let score = 0;
  const reasons: string[] = [];

  if (environment === "production") {
    score += 3;
    reasons.push("Production environment");
  } else if (environment === "staging") {
    score += 1;
    reasons.push("Staging environment");
  }

  if (level === "FATAL") {
    score += 4;
    reasons.push("FATAL-level event");
  } else if (level === "ERROR") {
    score += 2;
    reasons.push("ERROR-level event");
  } else if (level === "WARN") {
    score += 1;
    reasons.push("WARN-level event");
  }

  if (eventCount >= 100) {
    score += 4;
    reasons.push("Very high event frequency");
  } else if (eventCount >= 20) {
    score += 2;
    reasons.push("High event frequency");
  } else if (eventCount >= 5) {
    score += 1;
    reasons.push("Repeated event occurrence");
  }

  if (isSpike) {
    score += 3;
    reasons.push("Spike detected");
  }

  let severity: Severity;

  if (score >= 8) {
    severity = "critical";
  } else if (score >= 5) {
    severity = "high";
  } else if (score >= 3) {
    severity = "medium";
  } else {
    severity = "low";
  }

  return {
    severity,
    reasons,
  };
};

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const getHigherSeverity = (
  current: Severity,
  calculated: Severity
): Severity => {
  return severityRank[calculated] > severityRank[current]
    ? calculated
    : current;
};
