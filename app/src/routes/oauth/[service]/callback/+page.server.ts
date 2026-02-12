import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';
import { env } from '$env/dynamic/private';
import { api } from '$lib/convex/_generated/api';
import { cvx } from '$lib/server/convex';

export const load: PageServerLoad = async ({ url, locals, params }) => {
	const service = params.service
	if (!(service === 'arena' || service === 'raindrop')) return error(400, 'unsupported service')
	const { ctx } = locals

	const authService = ctx.services.get(service)!
	const connection = await authService.callback(url.searchParams)

	const existing = await cvx.query(api.oauth.getServiceConnection, {
		cvx_secret: env.SERVER_SECRET,
		sessionKey: locals.sessionKey,
		service
	})
	console.log({ existing: !!existing, service })

	// TODO: Revoke old session then making a new one
	if (!existing) await cvx.mutation(api.oauth.setServiceConnection, {
		cvx_secret: env.SERVER_SECRET,
		...connection,
		sessionKey: locals.sessionKey,
		service,
		displayName: connection.displayName ?? '',
	})

	redirect(302, '/accounts');
}
