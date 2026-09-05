import type { AuthUser } from "../types/auth";

const TOKEN_KEY = "incidentflow_token";
const USER_KEY = "incidentflow_user";

export const saveAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): AuthUser | null => {
  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as AuthUser;
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
