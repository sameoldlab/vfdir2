import { env } from '$env/dynamic/private';
import type { ServiceName, AuthContext, AuthService } from './types';

export const ensureSession = (ctx: AuthContext, key: string) =>
  ctx.convex.mutation(ctx.authApi.createSession, {
    key
  })

export const revokeSession = async (ctx: AuthContext, service: ServiceName, sessionKey: string) => {
  await ctx.convex.mutation(ctx.authApi.deleteServiceConnection, {
    cvx_secret: env.SERVER_SECRET,
    sessionKey: sessionKey,
    service,
  })

}
