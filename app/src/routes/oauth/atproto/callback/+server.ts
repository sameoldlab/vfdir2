import { error, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const atp = locals.ctx.services.get('atproto')
	if (!atp) return error(500, 'atproto service not found')

	const result = await atp.callback(url.searchParams);
	console.log(result)

	redirect(302, '/accounts');
}
