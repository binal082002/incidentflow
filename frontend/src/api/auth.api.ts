import type { AuthResponse } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const result = await response.json();

    throw new Error(result.message || "Failed to register");
  }

  const result = await response.json();

  return result.data;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const result = await response.json();

    throw new Error(result.message || "Failed to login");
  }

  const result = await response.json();

  return result.data;
};
