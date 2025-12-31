import { getOAuthClient } from '$lib/server/auth/atp_oauth';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const client = await getOAuthClient();

  return json(client.metadata, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
};
