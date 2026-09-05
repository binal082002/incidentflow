import { getToken, clearAuth } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return response;
};
