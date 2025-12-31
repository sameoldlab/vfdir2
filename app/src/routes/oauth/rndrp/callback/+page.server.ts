import { redirect } from '@sveltejs/kit';
import { handleOAuth2Callback } from '$lib/server/auth/manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	console.log(locals)
	await handleOAuth2Callback(locals.ctx, 'raindrop', locals.deviceUid, url.searchParams)

	redirect(302, '/');
}
