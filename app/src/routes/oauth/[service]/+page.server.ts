import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
  const service = locals.ctx.services.get(params.service)
  if (!service) error(402, `Service ${params.service} not configured`)

  throw redirect(302, service.auth_url);
}

export const actions = {
  revoke: async ({ locals, params }) => {
    const service = locals.ctx.services.get(params.service)
    if (!service) error(402, `Service ${params.service} not configured`)
    // service.revoke()

  }
} satisfies Actions;
