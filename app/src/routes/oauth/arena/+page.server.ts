import { redirect } from '@sveltejs/kit';
import { getOauth2Url, startOAuthFlow } from '$lib/server/auth/manager';
import type { Actions } from './$types';

export const actions = {
  default: async ({ locals }) => {
    const ctx = locals.ctx;
    console.log({ locals })

    const authUrl = getOauth2Url(ctx, 'arena');
    console.log({ authUrl })

    throw redirect(302, authUrl);
  }
} satisfies Actions;
