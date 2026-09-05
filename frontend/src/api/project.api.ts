import type { Project } from "../types/project";
import { apiFetch } from "./apiClient";

export interface CreateProjectResponse {
  project: Project;
  apiKey: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await apiFetch("/projects");

  if (!response.ok) {
    throw new Error("Failed to load projects");
  }

  const result = await response.json();

  return result.data;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await apiFetch(`/projects/${projectId}`);

  if (!response.ok) {
    throw new Error("Failed to load project");
  }

  const result = await response.json();

  return result.data;
};

export const createProject = async (
  name: string
): Promise<CreateProjectResponse> => {
  const response = await apiFetch("/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create project");
  }

  const result = await response.json();

  return {
    project: result.data,
    apiKey: result.api_key,
  };
};

export const regenerateProjectApiKey = async (
  projectId: string
): Promise<string> => {
  const response = await apiFetch(
    `/projects/${projectId}/ingest-key/regenerate`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to regenerate API key");
  }

  const result = await response.json();

  return result.api_key;
};
