# IncidentFlow

IncidentFlow is an event-driven incident monitoring platform inspired by tools like Sentry and PagerDuty. External applications send runtime errors to IncidentFlow, which groups similar errors into incidents, detects spikes, calculates severity, stores incident history, and pushes realtime updates to a React dashboard.

The project demonstrates full-stack development, asynchronous processing, Redis queues/PubSub, PostgreSQL data modelling, JWT authentication, project-level authorization, secure API-key ingestion, and Socket.IO realtime updates.

**Live Demo - https://incident-flow.netlify.app**
---

## Architecture

```text
External Application
        |
        | POST /api/v1/events
        | X-IncidentFlow-Key
        v
Node.js + Express API
        |
        | RPUSH
        v
Redis Event Queue
        |
        | BLPOP
        v
Background Worker
        |
        |-- Fingerprint similar errors
        |-- Group into incidents
        |-- Detect spikes
        |-- Calculate severity
        |-- Create timeline entries
        |
        +--------------------+
        |                    |
        v                    v
PostgreSQL             Redis Pub/Sub
                             |
                             v
                     Socket.IO API
                             |
                             v
                      React Dashboard
```

PostgreSQL is the source of truth. Redis is used for event queueing, spike detection, and realtime notifications.

---

## Main Features

### Authenticated Event Ingestion

Each project gets a unique ingest API key. External applications send events using:

```http
POST /api/v1/events
X-IncidentFlow-Key: <project-api-key>
```

Example:

```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "X-IncidentFlow-Key: <your-api-key>" \
  -d '{
    "service": "payment-service",
    "environment": "production",
    "level": "ERROR",
    "message": "Payment gateway timeout for order 1001",
    "endpoint": "/api/payment",
    "timestamp": "2026-09-05T09:30:00Z"
  }'
```

Only a SHA-256 hash of the ingest key is stored in PostgreSQL. The raw key is shown only when the project is created or regenerated.

### Error Fingerprinting

Similar errors are grouped using a deterministic fingerprint based on:

```text
service + endpoint + normalized message
```

Messages are normalized by lowercasing text, replacing numbers, collapsing spaces, and trimming whitespace.

Example:

```text
Payment gateway timeout for order 1001
Payment gateway timeout for order 9842
```

both normalize to:

```text
payment gateway timeout for order <number>
```

If service and endpoint also match, both events belong to the same active incident.

### Spike Detection

Redis detects bursts of repeated errors.

Current rule:

```text
5 matching events within 60 seconds = spike
```

A Redis counter is maintained per fingerprint. When the threshold is crossed, the incident timeline records a `spike_detected` event.

### Severity Engine

Severity is calculated using environment, event level, frequency, and spike state.

| Signal | Score |
|---|---:|
| Production | +3 |
| Staging | +1 |
| FATAL | +4 |
| ERROR | +2 |
| WARN | +1 |
| 5+ events | +1 |
| 20+ events | +2 |
| 100+ events | +4 |
| Spike | +3 |

Severity levels:

```text
0-2   → low
3-4   → medium
5-7   → high
8+    → critical
```

Active incidents can automatically escalate but do not automatically downgrade.

### Incident Lifecycle

```text
OPEN
 ├────────────→ RESOLVED
 │
 └→ ACKNOWLEDGED → RESOLVED
```

Acknowledged incidents still receive new matching events. Once resolved, future matching errors create a new incident.

### Incident Timeline

Important lifecycle changes are stored separately from raw events.

Current timeline types:

```text
created
acknowledged
resolved
severity_changed
spike_detected
```

### Realtime Dashboard

After processing an event, the worker publishes an incident update through Redis Pub/Sub.

```text
Worker
  ↓
Redis Pub/Sub
  ↓
API Subscriber
  ↓
Socket.IO
  ↓
React Dashboard
```

The frontend refetches the latest incident data when a realtime notification arrives.

---

## Authentication and Authorization

IncidentFlow uses two separate authentication methods.

### User Authentication

Users register and log in with email/password.

```text
Email + Password
      ↓
bcrypt
      ↓
JWT
      ↓
Protected APIs
```

JWT is sent using:

```http
Authorization: Bearer <token>
```

### Application Authentication

External applications use project-specific ingest API keys.

```text
Application
   ↓
X-IncidentFlow-Key
   ↓
Project resolved
   ↓
Service resolved within project
```

Projects belong to users through `owner_id`. Project and incident routes verify ownership before returning data.

Socket.IO connections are also JWT-authenticated. Users may join only realtime rooms for projects they own.

---

## Project dashboard

The dashboard shows:

- Active incidents
- Critical incidents
- High-severity incidents
- Acknowledged incidents
- Resolved incidents
- Service health
- Recent incidents

Service health is based on the worst active incident severity:

```text
critical > high > medium > low > healthy
```

The incident detail page shows severity, status, event count, environment, severity reasons, timeline, recent events, and Acknowledge/Resolve actions.

Project Settings includes service registration, ingest API key status, key regeneration, and integration instructions.

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Socket.IO Client

### Backend
- Node.js
- TypeScript
- Express
- Socket.IO
- bcrypt
- JWT

### Data / Infrastructure
- PostgreSQL
- Redis
- Docker
- SQL migrations

Testing foundation:
- Jest
- ts-jest
- Supertest

---

## Local Setup

### Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Start the worker separately:

```bash
npm run worker
```

Example backend `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=incidentflow
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Example frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## Production Build

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
```

The worker runs as a separate process.

---