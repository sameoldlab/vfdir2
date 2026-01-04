import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const { ctx } = locals
  const atpService = ctx.services.get('atproto')

  try {
    const client = await atpService.getClient(ctx)
    return json(client.jwks, { headers: { 'Cache-Control': 'no-store' } });

  } catch (err) {
    console.error(err)
    error(501, err)
  }
};
