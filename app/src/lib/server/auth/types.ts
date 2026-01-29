import type { api } from "$lib/convex/_generated/api";
import type { AuthorizeTarget, OAuthClient, OAuthSession } from "@atcute/oauth-node-client";
import type { ConvexHttpClient } from "convex/browser";

export type ServiceName = 'arena' | 'raindrop'
export type SessionCapabilities = ServiceName[]

export type AuthContext = {
  convex: ConvexHttpClient;
  authApi: typeof api.oauth;
  /** Looks up connected data providers */
  services: Map<ServiceName, AuthService<'oauth2'>> & Map<'atproto', AuthService<'atproto', OAuthSession>>;
}

export interface AuthService<Kind extends 'oauth2' | 'atproto', TSession = string | object,> {
  name: 'atproto' | ServiceName
  auth_url?: Kind extends 'oauth2' ? string : never
  getClient?: Kind extends 'oauth2' ? never : (ctx: AuthContext) => Promise<OAuthClient>
  authorize: Kind extends 'oauth2' ? never : (
    ctx: AuthContext,
    options: {
      sessionKey: string;
      returnTo?: string;
      target: AuthorizeTarget
    }
  ) => Promise<{ url: string; stateId: string }>;

  /** handles oauth redirect uri */
  callback(
    ctx: AuthContext,
    params: URLSearchParams
  ): Promise<{
    session: string;
    expiresAt?: number,
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
