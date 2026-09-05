import type { Service } from "../types/service";
import { apiFetch } from "./apiClient";

export const getServicesByProject = async (
  projectId: string
): Promise<Service[]> => {
  const response = await apiFetch(`/services/project/${projectId}`);

  if (!response.ok) {
    throw new Error("Failed to load services");
  }

  const result = await response.json();

  return result.data;
};

export const createService = async (
  projectId: string,
  name: string
): Promise<Service> => {
  const response = await apiFetch("/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      name,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create service");
  }

  const result = await response.json();

  return result.data;
};
