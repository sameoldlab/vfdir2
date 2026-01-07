import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureSession } from '$lib/server/auth/manager';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!(params.service === 'arena' || params.service === 'raindrop'))
    return error(400, `Service ${params.service} not supported`)
  const service = locals.ctx.services.get(params.service)
  if (!service) error(400, `Service ${params.service} not configured`)

  const result = await ensureSession(locals.ctx, locals.deviceUid)
  console.log({ ensureDevice: result })

  throw redirect(302, service.auth_url);
}
