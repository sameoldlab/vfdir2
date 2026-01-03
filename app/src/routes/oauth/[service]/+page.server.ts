import { redirect } from '@sveltejs/kit';
import { getOauth2Url, startOAuthFlow } from '$lib/server/auth/manager';
import type { Actions } from './$types';

export const actions = {
  default: async ({ locals, params }) => {
    throw redirect(302, getOauth2Url(locals.ctx, params.service));
  }
} satisfies Actions;
