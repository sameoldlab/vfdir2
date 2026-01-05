import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import type { Did } from "@atcute/lexicons";
import { ulid } from "ulidx";
import { ensureDevice, getCapabilities } from "$lib/server/auth/manager";
import type { AuthContext } from "$lib/server/auth/types";
import { ConvexHttpClient } from "convex/browser";
import { env } from "$env/dynamic/public";
import { env as penv } from "$env/dynamic/private";
import { api } from "$lib/convex/_generated/api";
import { newArenaService } from "$lib/server/auth/arena";
import { newRaindropService } from "$lib/server/auth/raindrop";
import { newAtpService } from "$lib/server/auth/atproto";

let ctx: AuthContext = null
export const init = () => {
  if (!ctx) {
    ctx = {
      convex: new ConvexHttpClient(env.PUBLIC_CONVEX_URL),
      authApi: api.oauth,
      services: new Map([
        ['raindrop', newRaindropService({
          clientId: env.PUBLIC_RNDRP_CLIENT_ID,
          clientSecret: penv.RNDRP_CLIENT_SECRET,
          redirect_uri: env.PUBLIC_RNDRP_CALLBACK_URL
        })],
        ['arena', newArenaService({
          clientId: env.PUBLIC_ARENA_CLIENT_ID,
          clientSecret: penv.ARENA_CLIENT_SECRET,
          redirect_uri: env.PUBLIC_ARENA_CALLBACK_URL
        })],
        ['atproto', newAtpService({
          client_name: 'vfdir',
          domain: 'https://vfdir.same.supply'
        })],
      ])
    }
  }
}

const sessionHandle: Handle = async ({ event, resolve }) => {
  let did = event.cookies.get('atproto_did') as Did

  if (did) {
    try {
      const oauth = await getOAuthClient()
      const session = await oauth.restore(did)
      event.locals.user = [session]
      event.locals.did = did
    } catch (err) {
      console.error('Failed to resote atp session: ', err)
      event.cookies.delete('atproto_did', { path: '/' })
    }
  }

  return resolve(event)
}
function getOAuthClient() {
  throw new Error("Function not implemented.");
}

const addAuthContext: Handle = async ({ event, resolve }) => {
  event.locals.ctx = ctx
  return resolve(event)
}

const sessionManger: Handle = async ({ event, resolve }) => {
  let deviceUid = event.cookies.get('device_uid')
  if (!deviceUid) {
    deviceUid = 'dev_' + ulid()
    event.cookies.set('device_uid', deviceUid, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 365 * 24 * 120
    })
  }

  event.locals.deviceUid = deviceUid

  try {
    let device = await ensureDevice(ctx, deviceUid)
    console.log({ device })
    event.locals.capabilities = await getCapabilities(ctx, device)
  } catch (err) {
    console.error('Failed to load device: ', deviceUid)
    console.error(err)
    event.locals.capabilities = []
  }

  return resolve(event)
}

export const handle: Handle = sequence(addAuthContext, sessionManger)

