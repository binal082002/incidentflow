
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../api/project.api";
import type { Project } from "../types/project";
import { clearAuth, getUser } from "../utils/auth";

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [createdProjectName, setCreatedProjectName] = useState("");

  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = projectName.trim();

    if (!name) return;

    try {
      setCreating(true);
      setError("");

      const result = await createProject(name);

      setProjects((current) => [result.project, ...current]);
      setCreatedApiKey(result.apiKey);
      setCreatedProjectName(result.project.name);
      setProjectName("");
    } catch (error) {
      console.error(error);
      setError("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(createdApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch {
      setError("Unable to copy API key. Please copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading projects...
      </div>
    );
  }

  if (error && !projects.length && !createdApiKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {error}
      </div>
    );
  }

  const isFirstTimeUser = projects.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              Incident<span className="text-indigo-400">Flow</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Incident monitoring for developers
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {isFirstTimeUser ? (
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-3xl">
                ⚡
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Welcome to IncidentFlow
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Know when your
                <span className="text-indigo-400"> applications </span>
                need attention.
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
                IncidentFlow helps you monitor application errors, group
                similar failures into incidents, detect error spikes and
                track service health — all from one dashboard.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="text-2xl">📁</div>
                <h3 className="mt-4 font-semibold text-white">
                  1. Create a project
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Create a project to organize the application you want to
                  monitor.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="text-2xl">🔌</div>
                <h3 className="mt-4 font-semibold text-white">
                  2. Connect a service
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Register a service and configure your application to send
                  events using your project API key.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="text-2xl">📊</div>
                <h3 className="mt-4 font-semibold text-white">
                  3. Monitor incidents
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  View incoming errors, investigate incidents and monitor
                  your application's health.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.07] p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">
                Let's get your first project started
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Give your project a name. You can connect your application
                and start receiving events in the next steps.
              </p>

              <form onSubmit={handleCreateProject} className="mt-6">
                <label
                  htmlFor="projectName"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Project name
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. My Backend API"
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={creating || !projectName.trim()}
                    className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create my project →"}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-400">{error}</p>
                )}
              </form>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                Workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold">Your Projects</h1>
              <p className="mt-2 text-sm text-slate-400">
                Select a project to view its incidents and service health.
              </p>
            </header>

            <form
              onSubmit={handleCreateProject}
              className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Create another project
              </h2>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Project name"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                />

                <button
                  type="submit"
                  disabled={creating || !projectName.trim()}
                  className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}
            </form>

            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/dashboard`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-indigo-500/40"
                >
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    View dashboard →
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {createdApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Project created successfully
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Your project{" "}
                  <span className="font-semibold text-slate-200">
                    {createdProjectName}
                  </span>{" "}
                  is ready.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreatedApiKey("")}
                className="text-xl text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ingest API Key
              </p>

              <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <code className="block break-all text-sm text-indigo-300">
                  {createdApiKey}
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
                For security, IncidentFlow stores only the key hash. The
                full API key will not be shown again.
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-200">
                What do I do next?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add this key to the application you want to monitor. When
                sending error events to IncidentFlow, include it in the{" "}
                <code className="text-indigo-300">
                  X-IncidentFlow-Key
                </code>{" "}
                header.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreatedApiKey("")}
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

export default ProjectsPage;
