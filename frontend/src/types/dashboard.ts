export interface DashboardSummary {
  active_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  acknowledged_incidents: number;
  resolved_incidents: number;
}

export interface ServiceHealth {
  id: string;
  name: string;
  active_incidents: number;
  health: "healthy" | "low" | "medium" | "high" | "critical";
}

export interface RecentIncident {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  event_count: number;
  last_seen_at: string;
  service_name: string;
}
