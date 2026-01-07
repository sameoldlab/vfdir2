import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url, locals, params }) => {
	const service = params.service
	if (!(service === 'arena' || service === 'raindrop')) return error(400, 'unsupported service')
	const { ctx } = locals

	const authService = ctx.services.get(service)
	const connection = await authService.callback(ctx, url.searchParams)

	const existing = await ctx.convex.query(ctx.authApi.getServiceConnection, {
		cvx_secret: import.meta.env.SERVER_SECRET,
		sessionKey: locals.deviceUid,
		service
	})
	console.log({ existing: !!existing, service })

	// TODO: Revoke old session then making a new one
	if (!existing) await ctx.convex.mutation(ctx.authApi.setServiceConnection, {
		cvx_secret: import.meta.env.SERVER_SECRET,
		...connection,
		sessionKey: locals.deviceUid,
		service,
		displayName: connection.displayName ?? '',
	})

	redirect(302, '/accounts');
}
