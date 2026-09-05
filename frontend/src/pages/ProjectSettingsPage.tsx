import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProjectById, regenerateProjectApiKey } from "../api/project.api";
import { getServicesByProject, createService } from "../api/service.api";

import type { Project } from "../types/project";
import type { Service } from "../types/service";

function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [serviceName, setServiceName] = useState("");
  const [creatingService, setCreatingService] = useState(false);

  const [newApiKey, setNewApiKey] = useState("");
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!projectId) {
        setError("Project ID is missing");
        setLoading(false);
        return;
      }

      try {
        const [projectData, serviceData] = await Promise.all([
          getProjectById(projectId),
          getServicesByProject(projectId),
        ]);

        setProject(projectData);
        setServices(serviceData);
      } catch (error) {
        console.error(error);
        setError("Failed to load project settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [projectId]);

  const handleRegenerateApiKey = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      "Regenerating the API key will immediately invalidate the current key. Continue?"
    );

    if (!confirmed) return;

    try {
      setRegeneratingKey(true);

      const apiKey = await regenerateProjectApiKey(projectId);

      setNewApiKey(apiKey);
      setCopied(false);
    } catch (error) {
      console.error(error);
      setError("Failed to regenerate API key");
    } finally {
      setRegeneratingKey(false);
    }
  };

  const handleCopyApiKey = async () => {
    await navigator.clipboard.writeText(newApiKey);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!projectId) return;

    const name = serviceName.trim();

    if (!name) {
      return;
    }

    try {
      setCreatingService(true);

      const newService = await createService(projectId, name);

      setServices((current) => [...current, newService]);

      setServiceName("");
    } catch (error) {
      console.error(error);
      setError("Failed to create service");
    } finally {
      setCreatingService(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading project settings...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {error || "Project not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to={`/projects/${projectId}/dashboard`}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to Dashboard
        </Link>

        <header className="mt-8 mb-10">
          <h1 className="text-3xl font-bold">{project.name}</h1>

          <p className="mt-2 text-slate-400">
            Manage services and IncidentFlow integration.
          </p>
        </header>

        <form
          onSubmit={handleCreateService}
          className="my-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <p className="text-sm font-medium text-slate-200">Add Service</p>

          <p className="mt-1 text-sm text-slate-400">
            Register a backend service that will send errors to this project.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              placeholder="e.g. payment-service"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={creatingService || !serviceName.trim()}
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingService ? "Adding..." : "Add Service"}
            </button>
          </div>
        </form>

        <section>
          <h2 className="text-xl font-semibold">Registered Services</h2>

          <p className="mt-1 text-sm text-slate-400">
            Services that can send incidents into this project.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            {services.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                No services registered yet.
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="border-b border-slate-800 px-6 py-4 last:border-b-0"
                >
                  <p className="font-medium text-slate-100">{service.name}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Integration</h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure how your application sends errors to IncidentFlow.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-slate-100">Ingest API Key</p>

                <p className="mt-1 text-sm text-slate-400">
                  {project.has_ingest_key
                    ? "An ingest API key is configured for this project."
                    : "No ingest API key is configured."}
                </p>

                {project.has_ingest_key && (
                  <p className="mt-3 font-mono text-sm text-slate-500">
                    if_proj_••••••••••••••••••••••••
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRegenerateApiKey}
                disabled={regeneratingKey}
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
              >
                {regeneratingKey ? "Regenerating..." : "Regenerate API Key"}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <p className="text-sm font-medium text-slate-200">
                Send events using this header
              </p>

              <div className="mt-3 rounded-lg bg-slate-950 px-4 py-3">
                <code className="text-sm text-indigo-300">
                  X-IncidentFlow-Key: &lt;your-api-key&gt;
                </code>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 border-t border-slate-800 pt-6">
          <h3 className="font-semibold text-slate-100">Send an event</h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Add your ingest API key to the application you want to monitor and
            send errors to the IncidentFlow ingest endpoint.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
            <pre className="text-sm leading-6 text-slate-300">
              {`curl -X POST http://localhost:5000/api/v1/events \\
  -H "Content-Type: application/json" \\
  -H "X-IncidentFlow-Key: <your-api-key>" \\
  -d '{
    "service": "${services[0]?.name ?? "payment-service"}",
    "environment": "production",
    "level": "ERROR",
    "message": "Payment gateway timeout",
    "endpoint": "/api/payment",
    "timestamp": "2026-09-05T12:00:00Z"
  }'`}
            </pre>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-medium text-slate-200">Important</p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The value of <code className="text-indigo-300">service</code> must
              match one of the services registered above.
            </p>
          </div>
        </div>
      </div>

      {newApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  New API key generated
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  The previous ingest API key has been invalidated.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNewApiKey("")}
                className="text-xl text-slate-500 transition hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                New Ingest API Key
              </p>

              <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <code className="block break-all text-sm text-indigo-300">
                  {newApiKey}
                </code>
              </div>

              <button
                type="button"
                onClick={handleCopyApiKey}
                className={`mt-3 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  copied
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                }`}
              >
                {copied ? "✓ Copied" : "Copy API Key"}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-200">
                Save this key now
              </p>

              <p className="mt-1 text-sm leading-6 text-yellow-200/70">
                The full key will not be shown again. Update your monitored
                application to use this new key.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewApiKey("")}
              className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              I've Saved My Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectSettingsPage;
