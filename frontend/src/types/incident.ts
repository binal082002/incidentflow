export interface IncidentEventItem {
  id: string;
  environment: "development" | "staging" | "production";
  level: "INFO" | "WARN" | "ERROR" | "FATAL";
  message: string;
  endpoint: string | null;
  occurred_at: string;
}

export interface TimelineItem {
  id: string;
  type:
    | "created"
    | "acknowledged"
    | "resolved"
    | "severity_changed"
    | "spike_detected";
  message: string;
  created_at: string;
}

export interface IncidentDetail {
  id: string;
  service_id: string;
  project_id: string;

  title: string;
  fingerprint: string;

  severity: "low" | "medium" | "high" | "critical";
  severity_reasons: string[];

  status: "open" | "acknowledged" | "resolved";

  event_count: number;

  started_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  created_at: string;

  service_name: string;

  events: IncidentEventItem[];
  timeline: TimelineItem[];
}
