import { redirect } from '@sveltejs/kit';
import { handleOAuth2Callback } from '$lib/server/auth/manager';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url, locals, params }) => {
	await handleOAuth2Callback(locals.ctx, params.service, locals.deviceUid, url.searchParams)

	redirect(302, '/');
}
