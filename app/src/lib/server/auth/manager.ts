import type { ServiceName, AuthContext, AuthService } from './types';

export const ensureDevice = (ctx: AuthContext, key: string) =>
  ctx.convex.mutation(ctx.authApi.createSession, {
    key
  })

// =======================================
// Oauth Flow
// ======================================= 

/* export const handleOAuthCallback = async (ctx: AuthContext, service: ServiceName, params: URLSearchParams): Promise<{
  sessionKey: string
  isNewConnection: boolean
}> => {
  const stateId = params.get('state')
  if (!stateId) {
    throw new Error('')
  }
  const stateData = await ctx.convex.query(ctx.authApi.getOAuthState, {
    cvx_secret: import.meta.env.SERVER_SECRET,
    stateId
  })
  if (!stateData) {
    throw new Error('')
  }

  const device = stateData.sessionId
  const authService = ctx.services.get(service)
  if (!authService) throw new Error(`Service ${service} not configured`)

  const { userId, session, displayName } = await authService.callback(ctx, params)

} */

export const handleOAuth2Callback = async (ctx: AuthContext, service: ServiceName, sessionKey: string, params: URLSearchParams) => {
  const authService = ctx.services.get(service)
  const connection = await authService.callback(ctx, params)

  const existing = await ctx.convex.query(ctx.authApi.getServiceConnection, {
    cvx_secret: import.meta.env.SERVER_SECRET,
    sessionKey, service
  })
  console.log({ existing })

  await ctx.convex.mutation(ctx.authApi.setServiceConnection, {
    cvx_secret: import.meta.env.SERVER_SECRET,
    ...connection,
    sessionKey,
    service,
    displayName: connection.displayName ?? '',
  })
}

export const revokeSession = async (ctx: AuthContext, service: ServiceName, sessionKey: string) => {
  await ctx.convex.mutation(ctx.authApi.deleteServiceConnection, {
    cvx_secret: import.meta.env.SERVER_SECRET,
    sessionKey: sessionKey,
    service,
  })

}
