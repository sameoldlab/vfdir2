import { redirect } from '@sveltejs/kit';
import { getOauth2Url } from '$lib/server/auth/manager';
import type { Actions } from './$types';

export const actions = {
  default: async ({ locals }) => {
    const ctx = locals.ctx;
    const authUrl = getOauth2Url(ctx, 'arena');

    throw redirect(302, authUrl);
  }
} satisfies Actions;
