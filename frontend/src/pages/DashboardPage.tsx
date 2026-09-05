import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { socket, connectSocket } from "../api/socket";
import {
  getDashboardSummary,
  getServiceHealth,
  getRecentIncidents,
} from "../api/dashboard.api";

import type {
  DashboardSummary,
  ServiceHealth,
  RecentIncident,
} from "../types/dashboard";
import { getProjectById } from "../api/project.api";
import type { Project } from "../types/project";

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [incidents, setIncidents] = useState<RecentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing");
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        const [projectData, summaryData, serviceData, incidentData] =
          await Promise.all([
            getProjectById(projectId),
            getDashboardSummary(projectId),
            getServiceHealth(projectId),
            getRecentIncidents(projectId),
          ]);

        setProject(projectData);
        setSummary(summaryData);
        setServices(serviceData);
        setIncidents(incidentData);
      } catch (error) {
        console.error(error);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    connectSocket();

    socket.emit("project:join", projectId);

    const handleIncidentUpdate = async () => {
      try {
        const [summaryData, serviceData, incidentData] = await Promise.all([
          getDashboardSummary(projectId),
          getServiceHealth(projectId),
          getRecentIncidents(projectId),
        ]);

        setSummary(summaryData);
        setServices(serviceData);
        setIncidents(incidentData);
      } catch (error) {
        console.error("Failed to refresh dashboard:", error);
      }
    };

    socket.on("incident:update", handleIncidentUpdate);

    return () => {
      socket.off("incident:update", handleIncidentUpdate);
      socket.disconnect();
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Project unavailable</h1>

          <p className="mt-2 text-slate-400">
            This project does not exist or you do not have access to it.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Projects
          </Link>

          <Link
            to={`/projects/${projectId}/settings`}
            className="text-sm font-medium text-slate-400 hover:text-slate-100"
          >
            Project Settings →
          </Link>
        </div>

        {/* Header */}
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {project?.name}
          </h1>

          <p className="mt-3 text-base text-slate-400 sm:text-lg">
            Monitor incidents and service health in real time.
          </p>
        </header>

        {/* Overview */}
        <section className="mb-12">
          <SectionHeader
            title="Overview"
            description="Current incident status across this project."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <SummaryCard
              label="Active Incidents"
              value={summary?.active_incidents ?? 0}
              valueClass="text-white"
            />

            <SummaryCard
              label="Critical"
              value={summary?.critical_incidents ?? 0}
              valueClass="text-red-400"
            />

            <SummaryCard
              label="High"
              value={summary?.high_incidents ?? 0}
              valueClass="text-orange-400"
            />

            <SummaryCard
              label="Acknowledged"
              value={summary?.acknowledged_incidents ?? 0}
              valueClass="text-yellow-400"
            />

            <SummaryCard
              label="Resolved"
              value={summary?.resolved_incidents ?? 0}
              valueClass="text-emerald-400"
            />
          </div>
        </section>

        {/* Service Health */}
        <section className="mb-12">
          <SectionHeader
            title="Service Health"
            description="Health is based on the highest severity active incident."
          />

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-5 shadow-sm transition hover:border-slate-700 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-slate-300">
                    {service.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-100">
                      {service.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {service.active_incidents} active{" "}
                      {service.active_incidents === 1
                        ? "incident"
                        : "incidents"}
                    </p>
                  </div>
                </div>

                <StatusBadge value={service.health} />
              </div>
            ))}
          </div>
        </section>

        {/* Recent Incidents */}
        <section>
          <SectionHeader
            title="Recent Incidents"
            description="The most recently active incidents in this project."
          />

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                to={`/incidents/${incident.id}`}
                className="block border-b border-slate-800 px-6 py-5 transition last:border-b-0 hover:bg-slate-800/40"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">
                      {incident.title}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span>{incident.service_name}</span>

                      <span className="text-slate-600">•</span>

                      <span>
                        {incident.event_count}{" "}
                        {incident.event_count === 1 ? "event" : "events"}
                      </span>

                      <span className="text-slate-600">•</span>

                      <span>Last seen {formatDate(incident.last_seen_at)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge value={incident.severity} />
                    <StatusBadge value={incident.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>

      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-700">
      <p className="text-sm font-medium text-slate-400">{label}</p>

      <p className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    healthy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    low: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    medium: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    high: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    critical: "border-red-500/20 bg-red-500/10 text-red-400",
    open: "border-red-500/20 bg-red-500/10 text-red-400",
    acknowledged: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    resolved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        styles[value] ?? "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      {value}
    </span>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default DashboardPage;
