export type EventLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export type Environment = "development" | "staging" | "production";

export interface IncidentEvent {
  service: string;
  environment: Environment;
  level: EventLevel;
  message: string;
  endpoint?: string;
  timestamp: string;
}