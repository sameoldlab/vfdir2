import { error, redirect } from '@sveltejs/kit';
import { ensureSession } from '$lib/server/auth/manager';
import type { Actions } from './$types';
import type { ActorIdentifier } from '@atcute/lexicons';
import {
  AmbiguousHandleError,
  DidNotFoundError,
  FailedHandleResolutionError,
  HandleResolutionError,
  InvalidResolvedHandleError,
} from '@atcute/identity-resolver';

export const actions = {
  connect: async ({ locals, request }) => {
    try {
      const result = await ensureSession(locals.sessionKey)
      if (!result) error(501, { message: JSON.stringify([{ error: 'no session' }]) })

      const identifier = (await request.formData()).get('atproto-connect')
      if (!identifier) error(403, { message: JSON.stringify([{ field: 'atproto-connect', error: 'is null' }]) })
      console.log({ identifier })
      const atpService = locals.ctx.services.get('atproto')
      const client = await atpService.getClient(locals.ctx)

      const res = await client.authorize({
        target: {
          type: 'account',
          identifier: identifier.toString() as ActorIdentifier
        }
      })
      /* const atp = locals.ctx.services.get('atproto')!
      const { url: authUrl } = await atp.authorize(locals.ctx, {
        sessionKey: locals.sessionKey,
        /* target: identifier.toString().startsWith('https://') ? {
          type: 'pds',
          serviceUrl: identifier.toString()
        } : {
          type: 'account',
          identifier: identifier.toString() as ActorIdentifier
        } * /
        target: {
          type: 'account',
          identifier: identifier.toString() as ActorIdentifier
        }
      }) */
      if (!res.url) error(501, 'Fml')
      console.log({ url: res.url })
      redirect(302, res.url);
    } catch (err) {
      if (err instanceof DidNotFoundError) {
        // handle has no DID record
        error(404, 'handle not found');
      } else if (err instanceof InvalidResolvedHandleError) {
        // handle returned an invalid DID format
        error(401, `invalid DID: ${err.did}`);
      } else if (err instanceof AmbiguousHandleError) {
        // multiple different DIDs found (with 'both' strategy)
        error(401, 'ambiguous handle');
      } else if (err instanceof FailedHandleResolutionError) {
        // network or other unexpected error
        error(501, `resolution failed: ${err.cause}`);
      } else if (err instanceof HandleResolutionError) {
        // catch-all for any handle resolution error
        console.error(`HandleResolutionError: ${err.message}`)
      }
      console.error(err)
      console.error(`cause: ${err.cause}`)
      error(500, err)
    }
  }
} satisfies Actions;
