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

    if (!name) {
      return;
    }

    try {
      setCreating(true);

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
    await navigator.clipboard.writeText(createdApiKey);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-slate-400">{user?.email}</p>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-slate-400 transition hover:text-slate-100"
          >
            Logout
          </button>
        </div>
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            IncidentFlow
          </p>

          <h1 className="mt-3 text-4xl font-bold">Your Projects</h1>

          <p className="mt-3 text-slate-400">
            Select a project to view its incidents and service health.
          </p>
        </header>

        <form
          onSubmit={handleCreateProject}
          className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Project name"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={creating || !projectName.trim()}
              className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/dashboard`}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-indigo-500/40"
            >
              <h2 className="text-lg font-semibold">{project.name}</h2>

              <p className="mt-2 text-sm text-slate-400">View dashboard →</p>
            </Link>
          ))}
        </div>
      </div>

      {createdApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
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
                className="text-xl text-slate-500 transition hover:text-slate-200"
              >
                ×
              </button>
            </div>

            {/* API Key */}
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

            {/* Warning */}
            <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-200">
                Save this key now
              </p>

              <p className="mt-1 text-sm leading-6 text-yellow-200/70">
                For security, IncidentFlow stores only the key hash. The full
                API key will not be shown again.
              </p>
            </div>

            {/* Next step */}
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-200">
                What do I do next?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add this key to the application you want to monitor. When
                sending error events to IncidentFlow, include it in the{" "}
                <code className="text-indigo-300">X-IncidentFlow-Key</code>{" "}
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
