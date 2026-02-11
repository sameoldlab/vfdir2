import { env } from '$env/dynamic/private';
import { api } from '$lib/convex/_generated/api';
import { cvx } from '../convex';
import type { ServiceName } from './types';

export const ensureSession = (key: string) =>
  cvx.mutation(api.oauth.createSession, {
    key
  })

export const revokeSession = async (service: ServiceName, sessionKey: string) => {
  await cvx.mutation(api.oauth.deleteServiceConnection, {
    cvx_secret: env.SERVER_SECRET,
    sessionKey: sessionKey,
    service,
  })

}
