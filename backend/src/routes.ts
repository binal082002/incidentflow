import { Router } from "express";
import { healthCheck } from "./controllers/health.controller";
import {
  createProject,
  getProjects,
  getProjectById,
  regenerateProjectApiKey
} from "./controllers/project.controller";
import {
  createService,
  getServicesByProject,
} from "./controllers/service.controller";
import { ingestEvent } from "./controllers/event.controller";
import {
  getIncidentsByProject,
  getIncidentById,
  acknowledgeIncident,
  resolveIncident,
} from "./controllers/incident.controller";
import {
  getProjectDashboard,
  getProjectServiceHealth,
  getRecentProjectIncidents,
} from "./controllers/dashboard.controller";
import { register, login } from "./controllers/auth.controller";
import { requireAuth } from "./middleware/auth.middleware";
import { requireProjectOwner } from "./middleware/projectOwner.middleware";
import { requireIncidentOwner } from "./middleware/incidentOwner.middleware";

const router = Router();

router.get("/health", healthCheck);

router.post("/auth/register", register);
router.post("/auth/login", login);

router.post("/projects", requireAuth, createProject);
router.get("/projects", requireAuth, getProjects);
router.get("/projects/:projectId", requireAuth, getProjectById);
router.post("/projects/:projectId/ingest-key/regenerate", requireAuth, requireProjectOwner, regenerateProjectApiKey);

router.post("/services", requireAuth, createService);
router.get("/services/project/:projectId", requireAuth, requireProjectOwner, getServicesByProject);

router.post("/events", ingestEvent);

router.get("/incidents/project/:projectId", requireAuth, requireProjectOwner, getIncidentsByProject);
router.get("/incidents/:incidentId", requireAuth, requireIncidentOwner, getIncidentById);
router.patch("/incidents/:incidentId/acknowledge", requireAuth, requireIncidentOwner, acknowledgeIncident);
router.patch("/incidents/:incidentId/resolve", requireAuth, requireIncidentOwner, resolveIncident);

router.get("/dashboard/project/:projectId", requireAuth, requireProjectOwner, getProjectDashboard);
router.get("/dashboard/project/:projectId/services", requireAuth, requireProjectOwner, getProjectServiceHealth);
router.get(
  "/dashboard/project/:projectId/recent-incidents",requireAuth, requireProjectOwner, getRecentProjectIncidents);

export default router;
