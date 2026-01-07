import { error, redirect } from '@sveltejs/kit';
import { ensureDevice } from '$lib/server/auth/manager';
import type { Actions } from './$types';
import type { ActorIdentifier } from '@atcute/lexicons';

export const actions = {
  connect: async ({ locals, request }) => {
    const result = await ensureDevice(locals.ctx, locals.deviceUid)
    if (!result) throw error(501, { message: JSON.stringify([{ error: 'no session' }]) })

    const identifier = (await request.formData()).get('atproto-connect')
    if (!identifier) throw error(403, { message: JSON.stringify([{ field: 'atproto-connect', error: 'is null' }]) })

    let rest = identifier.toString().startsWith('https://') ? { serviceProvider: identifier.toString() } : { identifier: identifier.toString() as ActorIdentifier }

    const atp = locals.ctx.services.get('atproto')
    const { url: authUrl } = await atp.authorize(locals.ctx, {
      returnTo: '',
      sessionKey: locals.deviceUid,
      ...rest
    })
    console.log({ authUrl })

    throw redirect(302, authUrl);
  }
} satisfies Actions;
