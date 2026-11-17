export type EventLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export type Environment = "development" | "staging" | "production";

export interface IncidentEvent {
  eventId: string;
  service: string;
  environment: Environment;
  level: EventLevel;
  message: string;
  endpoint?: string;
  timestamp: string;
}
