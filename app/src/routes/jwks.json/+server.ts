import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getOAuthClient } from '$lib/server/auth/atp_oauth';

export const GET: RequestHandler = async () => {
  const client = await getOAuthClient();

  return json(client.jwks, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
};
