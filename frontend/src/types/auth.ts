export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
