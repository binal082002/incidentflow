import type {
  DashboardSummary,
  ServiceHealth,
  RecentIncident,
} from "../types/dashboard";

import { apiFetch } from "./apiClient";

export const getDashboardSummary = async (
  projectId: string
): Promise<DashboardSummary> => {
  const response = await apiFetch(`/dashboard/project/${projectId}`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard summary");
  }

  const result = await response.json();

  return result.data;
};

export const getServiceHealth = async (
  projectId: string
): Promise<ServiceHealth[]> => {
  const response = await apiFetch(`/dashboard/project/${projectId}/services`);

  if (!response.ok) {
    throw new Error("Failed to load service health");
  }

  const result = await response.json();

  return result.data;
};

export const getRecentIncidents = async (
  projectId: string
): Promise<RecentIncident[]> => {
  const response = await apiFetch(
    `/dashboard/project/${projectId}/recent-incidents`
  );

  if (!response.ok) {
    throw new Error("Failed to load recent incidents");
  }

  const result = await response.json();

  return result.data;
};
