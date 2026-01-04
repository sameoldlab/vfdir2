import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const { ctx } = locals
  const atpService = ctx.services.get('atproto')

  const client = await atpService.getClient(ctx)

  return json(client.metadata, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
};
