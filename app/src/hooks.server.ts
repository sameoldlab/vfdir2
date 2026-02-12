import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
// import type { Did } from "@atcute/lexicons";
import { ulid } from "ulidx";
import { ensureSession } from "$lib/server/auth/manager";
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

// const sessionHandle: Handle = async ({ event, resolve }) => {
//   let did = event.cookies.get('atproto_did') as Did

//   if (did) {
//     try {
//       const oauth = await getOAuthClient()
//       const session = await oauth.restore(did)
//       event.locals.user = [session]
//       event.locals.did = did
//     } catch (err) {
//       console.error('Failed to resote atp session: ', err)
//       event.cookies.delete('atproto_did', { path: '/' })
//     }
//   }

//   return resolve(event)
// }

const addAuthContext: Handle = async ({ event, resolve }) => {
  event.locals.ctx = ctx
  return resolve(event)
}

const sessionManger: Handle = async ({ event, resolve }) => {
  let sessionKey = event.cookies.get('vfdir_sessionKey')
  if (!sessionKey) {
    sessionKey = 'dev_' + ulid()
    event.cookies.set('vfdir_sessionKey', sessionKey, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 365 * 24 * 1200
    })
  }

  try {
    let session = await ensureSession(sessionKey)
    if (session) event.locals.sessionKey = sessionKey
  } catch (err) {
    console.error('Failed to persist session: ', sessionKey, err)
    event.locals.capabilities = []
  }

  return resolve(event)
}

export const handle: Handle = sequence(addAuthContext, sessionManger)

