import type { Id } from '$lib/convex/_generated/dataModel';
import type { ServiceName, ServiceConnection, SessionCapabilities, ServiceSuggestion, AuthContext } from './types';

export const ensureDevice = (ctx: AuthContext, uid: string) =>
  ctx.convex.mutation(ctx.authApi.getOrCreateDevice, {
    uid
  })

export const getDevice = (ctx: AuthContext, uid: string) =>
  ctx.convex.query(ctx.authApi.getDevice, {
    uid
  })

export const getConnections = (ctx: AuthContext, deviceId: Id<'devices'>) =>
  ctx.convex.query(ctx.authApi.getAllServiceConnections, {
    deviceId
  })

export const getCapabilities = async (ctx: AuthContext, deviceId: Id<'devices'>): Promise<SessionCapabilities> =>
  (await getConnections(ctx, deviceId)).map(c => c.service)

// =======================================
// Oauth Flow
// ======================================= 

export function getOauth2Url(ctx: AuthContext, service: ServiceName) {
  const authService = ctx.services.get(service)
  if (!authService) throw new Error(`Service ${service} not configured`)

  return authService.auth_url
}

export async function startOAuthFlow(ctx: AuthContext, service: ServiceName, opts: {
  deviceUid: string
  returnTo?: string
}) {
  await ensureDevice(ctx, opts.deviceUid)

  const authService = ctx.services.get(service)
  if (!authService) throw new Error(`Service ${service} not configured`)

  const { url } = await authService.authorize(ctx, {
    ...opts
  })

  return url
}

export const handleOAuthCallback = async (ctx: AuthContext, service: ServiceName, params: URLSearchParams): Promise<{
  devideUid: string
  isNewConnection: boolean
}> => {
  const stateId = params.get('state')
  if (!stateId) {
    throw new Error('')
  }
  const stateData = await ctx.convex.query(ctx.authApi.getOAuthState, {
    stateId
  })
  if (!stateData) {
    throw new Error('')
  }

  const device = stateData.deviceId
  const authService = ctx.services.get(service)
  if (!authService) throw new Error(`Service ${service} not configured`)

  const { userId, session, displayName } = await authService.callback(ctx, params)

}

export const handleOAuth2Callback = async (ctx: AuthContext, service: ServiceName, deviceUid: string, params: URLSearchParams) => {
  const authService = ctx.services.get(service)
  const connection = await authService.callback(ctx, params)

  const existing = await ctx.convex.query(ctx.authApi.getServiceConnection, {
    deviceUid, service
  })
  console.log({ existing })

  await ctx.convex.mutation(ctx.authApi.setServiceConnection, {
    deviceUid,
    service,
    ...connection
  })

  const device = await getDevice(ctx, deviceUid)

  if (!device) {
    console.log(device)
    throw new Error('Device not found after callback');
  }
}
