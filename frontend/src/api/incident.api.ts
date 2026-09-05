import type { IncidentDetail } from "../types/incident";
import { apiFetch } from "./apiClient";

export const getIncidentById = async (
  incidentId: string
): Promise<IncidentDetail> => {
  const response = await apiFetch(`/incidents/${incidentId}`);

  if (!response.ok) {
    throw new Error("Failed to load incident");
  }

  const result = await response.json();

  return result.data;
};

export const acknowledgeIncident = async (
  incidentId: string
): Promise<void> => {
  const response = await apiFetch(`/incidents/${incidentId}/acknowledge`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to acknowledge incident");
  }
};

export const resolveIncident = async (incidentId: string): Promise<void> => {
  const response = await apiFetch(`/incidents/${incidentId}/resolve`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to resolve incident");
  }
};
