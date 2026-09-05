import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getIncidentById,
  acknowledgeIncident,
  resolveIncident,
} from "../api/incident.api";
import type { IncidentDetail } from "../types/incident";
import { socket, connectSocket } from "../api/socket";

function IncidentDetailPage() {
  const { incidentId } = useParams<{ incidentId: string }>();

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshIncident = async () => {
    if (!incidentId) return;

    const data = await getIncidentById(incidentId);
    setIncident(data);
  };

  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) {
        setError("Incident ID is missing");
        setLoading(false);
        return;
      }

      try {
        const data = await getIncidentById(incidentId);
        setIncident(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load incident");
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [incidentId]);

  useEffect(() => {
    const projectId = incident?.project_id;

    if (!incidentId || !projectId) {
      return;
    }

    connectSocket();

    socket.emit("project:join", projectId);

    const handleIncidentUpdate = async (data: {
      incidentId: string;
      projectId: string;
    }) => {
      if (data.incidentId !== incidentId) {
        return;
      }

      try {
        const updatedIncident = await getIncidentById(incidentId);

        setIncident(updatedIncident);
      } catch (error) {
        console.error("Failed to refresh incident:", error);
      }
    };

    socket.on("incident:update", handleIncidentUpdate);

    return () => {
      socket.off("incident:update", handleIncidentUpdate);
      socket.disconnect();
    };
  }, [incidentId, incident?.project_id]);

  const handleAcknowledge = async () => {
    if (!incidentId) return;

    try {
      await acknowledgeIncident(incidentId);
      await refreshIncident();
    } catch (error) {
      console.error(error);
      setError("Failed to acknowledge incident");
    }
  };

  const handleResolve = async () => {
    if (!incidentId) return;

    try {
      await resolveIncident(incidentId);
      await refreshIncident();
    } catch (error) {
      console.error(error);
      setError("Failed to resolve incident");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading incident...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {error || "Incident not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          to={`/projects/${incident.project_id}/dashboard`}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
            Incident
          </p>

          <h1 className="mt-2 text-3xl font-bold">{incident.title}</h1>

          <p className="mt-2 text-slate-400">{incident.service_name}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {incident.status === "open" && (
            <button
              onClick={handleAcknowledge}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
            >
              Acknowledge
            </button>
          )}

          {incident.status !== "resolved" && (
            <button
              onClick={handleResolve}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Resolve
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Severity" value={incident.severity} />

          <InfoCard label="Status" value={incident.status} />

          <InfoCard label="Events" value={String(incident.event_count)} />

          <InfoCard
            label="Environment"
            value={incident.events[0]?.environment ?? "Unknown"}
          />
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Severity Reasons</h2>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            {incident.severity_reasons.length === 0 ? (
              <p className="text-slate-400">No severity reasons available.</p>
            ) : (
              <ul className="space-y-2">
                {incident.severity_reasons.map((reason) => (
                  <li key={reason} className="text-slate-300">
                    • {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Incident Timeline</h2>

          <p className="mt-1 text-sm text-slate-400">
            History of important changes to this incident.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            {incident.timeline.length === 0 ? (
              <p className="text-slate-400">No timeline activity yet.</p>
            ) : (
              <div className="space-y-0">
                {incident.timeline.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {/* vertical line */}
                    {index !== incident.timeline.length - 1 && (
                      <div className="absolute left-[7px] top-4 h-full w-px bg-slate-700" />
                    )}

                    {/* dot */}
                    <div className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-slate-900 bg-indigo-400" />

                    <div>
                      <p className="font-medium text-slate-200">
                        {item.message}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="capitalize">
                          {item.type.replaceAll("_", " ")}
                        </span>

                        <span>•</span>

                        <span>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Recent Events</h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            {incident.events.map((event) => (
              <div
                key={event.id}
                className="border-b border-slate-800 px-6 py-5 last:border-b-0"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="font-medium">{event.message}</p>

                    <p className="mt-2 text-sm text-slate-400">
                      {event.endpoint ?? "No endpoint"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-400">{event.level}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-2 text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}

export default IncidentDetailPage;
