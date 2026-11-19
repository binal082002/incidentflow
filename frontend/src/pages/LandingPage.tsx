import { Link, Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import { Activity, Layers, TrendingUp, Radio } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time Error Tracking",
    description:
      "Capture application errors as they happen and get visibility into failures across your services.",
  },
  {
    icon: Layers,
    title: "Smart Incident Grouping",
    description:
      "Automatically group similar errors so you can investigate one incident instead of hundreds of events.",
  },
  {
    icon: TrendingUp,
    title: "Spike Detection",
    description:
      "Identify sudden increases in errors and spot unusual application behaviour.",
  },
  {
    icon: Radio,
    title: "Live Monitoring",
    description:
      "Track incident activity, severity and service health from a single dashboard.",
  },
];

function LandingPage() {
  // Authenticated users should go directly to their workspace.
  if (getToken()) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Navbar */}

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          Incident<span className="text-indigo-400">Flow</span>
        </Link>

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden text-sm text-slate-400 transition hover:text-white sm:block"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="hidden text-sm text-slate-400 transition hover:text-white sm:block"
          >
            How It Works
          </a>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="relative px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="absolute left-1/2 top-10 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Application incident monitoring
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Know when your application
              <span className="block text-indigo-400">needs attention.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Stop searching through endless error logs. IncidentFlow captures
              application errors, groups related failures and helps you monitor
              incidents across your services in real time.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-indigo-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:-translate-y-1 hover:bg-indigo-400"
              >
                Start Monitoring for Free →
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Create an account and connect your first application.
            </p>
          </div>

          {/* Product Preview */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-800 px-6 py-4">
                <p className="text-sm font-semibold text-white">
                  IncidentFlow Dashboard
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Monitor incidents and service health in real time
                </p>
              </div>

              <div className="p-5 sm:p-7">
                {/* Overview */}
                <h3 className="text-lg font-semibold text-white">Overview</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Current incident status across your project.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    {
                      label: "Active Incidents",
                      value: "2",
                      color: "text-white",
                    },
                    { label: "Critical", value: "1", color: "text-red-400" },
                    { label: "High", value: "0", color: "text-orange-400" },
                    {
                      label: "Acknowledged",
                      value: "0",
                      color: "text-yellow-400",
                    },
                    {
                      label: "Resolved",
                      value: "1",
                      color: "text-emerald-400",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className={`mt-3 text-2xl font-bold ${item.color}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Service Health */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white">
                    Service Health
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Health is based on the highest severity active incident.
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-bold text-slate-300">
                        P
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          payment-service
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          2 active incidents
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                      CRITICAL
                    </span>
                  </div>
                </div>

                {/* Recent Incidents */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Incidents
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    The most recently active incidents in this project.
                  </p>

                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    {[
                      {
                        name: "Database connection timeout",
                        service: "payment-service",
                        events: "12 events",
                        severity: "CRITICAL",
                        severityColor:
                          "text-red-400 border-red-500/30 bg-red-500/10",
                        status: "OPEN",
                      },
                      {
                        name: "Payment gateway request failed",
                        service: "payment-service",
                        events: "5 events",
                        severity: "HIGH",
                        severityColor:
                          "text-orange-400 border-orange-500/30 bg-orange-500/10",
                        status: "OPEN",
                      },
                      {
                        name: "Request validation error",
                        service: "payment-service",
                        events: "2 events",
                        severity: "MEDIUM",
                        severityColor:
                          "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
                        status: "RESOLVED",
                      },
                    ].map((incident) => (
                      <div
                        key={incident.name}
                        className="flex flex-col justify-between gap-3 border-b border-slate-800 p-4 last:border-0 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {incident.name}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {incident.service} <span className="mx-2">·</span>
                            {incident.events}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${incident.severityColor}`}
                          >
                            {incident.severity}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-slate-800 bg-slate-900/40 px-6 py-24 lg:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                Features
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                Everything you need to understand incidents
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                Turn application errors into actionable insights.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-indigo-500/40"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <feature.icon size={24} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                Getting Started
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                From setup to insights in three steps
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Create a project",
                  description:
                    "Create a project to organize the application you want to monitor.",
                },
                {
                  number: "02",
                  title: "Connect your service",
                  description:
                    "Register a service and configure your application to send events using your project API key.",
                },
                {
                  number: "03",
                  title: "Monitor incidents",
                  description:
                    "Explore incoming events, investigate grouped incidents and monitor service health.",
                },
              ].map((step) => (
                <div key={step.number} className="relative">
                  <p className="text-4xl font-bold text-indigo-500/40">
                    {step.number}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 lg:px-10">
          <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-slate-900 p-10 text-center sm:p-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Don't let application errors go unnoticed.
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
              Start monitoring your services and get better visibility into
              application failures.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex rounded-xl bg-indigo-500 px-8 py-4 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Get Started with IncidentFlow →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-bold text-white">
            Incident<span className="text-indigo-400">Flow</span>
          </p>
          <p className="text-xs text-slate-500">
            Built for developers who care about reliability.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
