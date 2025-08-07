// Shared interfaces for authentication-related payloads
import type { User } from '../db/user';

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthRegisterPayload {
  email: string;
  password: string;
  name: string;
}

export type AuthRequestPayload = AuthLoginPayload | AuthRegisterPayload;

export interface AuthSuccessPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthFailurePayload {
  reason: string;
}

export interface AuthRefreshPayload {
  refreshToken: string;
}

export interface AuthRefreshSuccessPayload {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLogoutPayload {
  refreshToken: string;
}
