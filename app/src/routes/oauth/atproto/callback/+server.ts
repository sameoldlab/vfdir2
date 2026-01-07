import { redirect, type RequestHandler } from '@sveltejs/kit';
// import { ensureDevice } from '$lib/server/auth/manager';

export const GET: RequestHandler = async ({ url, locals }) => {
	const atp = locals.ctx.services.get('atproto')

	const { userId: did, session } = await atp.callback(locals.ctx, url.searchParams);

	redirect(302, '/accounts');
}
