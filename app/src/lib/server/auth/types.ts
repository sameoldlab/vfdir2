import type { api } from "$lib/convex/_generated/api";
import type { ConvexHttpClient } from "convex/browser";

export type ServiceName = 'atproto' | 'arena' | 'raindrop'
export type SessionCapabilities = ServiceName[]

export type AuthContext = {
  convex: ConvexHttpClient;
  authApi: typeof api.oauth;
  /** Looks up connected data providers */
  services: Map<ServiceName, AuthService>;
}

export interface AuthService<TSession = string | object, Kind = 'oauth2' | 'atproto'> {
  name: ServiceName
  auth_url: string

  authorize(
    ctx: AuthContext,
    options: {
      sessionKey: string;
      returnTo?: string;
    }
  ): Promise<{ url: string; state: string }>;

  /** handles oauth redirect uri */
  callback(
    ctx: AuthContext,
    params: URLSearchParams
  ): Promise<{
    session: string;
    expiresAt: number,
    userId: string | number;
    displayName?: string;
  }>;

  restore(sessionData: string): Promise<TSession>;

  revoke(session: TSession): Promise<void>;

  serializeSession(session: TSession): string;
}

export type ServiceConnection = {
  service: ServiceName;
  userId: string;
  displayName: string;
}

export type ServiceSuggestion = {
  service: ServiceName;
  displayName: string;
}
