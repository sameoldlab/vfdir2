import { error, redirect } from '@sveltejs/kit';
import { ensureSession } from '$lib/server/auth/manager';
import type { Actions } from './$types';
import type { ActorIdentifier } from '@atcute/lexicons';

export const actions = {
  connect: async ({ locals, request }) => {
    try {
      const result = await ensureSession(locals.ctx, locals.sessionKey)
      if (!result) throw error(501, { message: JSON.stringify([{ error: 'no session' }]) })

      const identifier = (await request.formData()).get('atproto-connect')
      if (!identifier) throw error(403, { message: JSON.stringify([{ field: 'atproto-connect', error: 'is null' }]) })
      console.log({ identifier })

      const atp = locals.ctx.services.get('atproto')!
      const { url: authUrl } = await atp.authorize(locals.ctx, {
        sessionKey: locals.sessionKey,
        target: identifier.toString().startsWith('https://') ? {
          type: 'pds',
          serviceUrl: identifier.toString()
        } : {
          type: 'account',
          identifier: identifier.toString() as ActorIdentifier
        }
      })
      console.log({ authUrl })

      throw redirect(302, authUrl);
    } catch (err) {
      console.error(err)
      error(err)
    }
  }
} satisfies Actions;
