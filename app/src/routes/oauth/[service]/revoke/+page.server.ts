import { error, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureSession } from '$lib/server/auth/manager';

export const load: PageServerLoad = async ({ locals, params }) => {
  const result = await ensureSession(locals.ctx, locals.sessionKey)
  console.log({ ensureSession: result })

  if (!(params.service === 'arena' || params.service === 'raindrop'))
    return error(400, `Service ${params.service} not supported`)
  const service = locals.ctx.services.get(params.service)
  if (!service) error(400, `Service ${params.service} not configured`)


  return json({ error: 'unimplemented' })
}
