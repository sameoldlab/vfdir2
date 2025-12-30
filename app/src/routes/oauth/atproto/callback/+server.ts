import { redirect } from '@sveltejs/kit';
import { getOAuthClient } from '$lib/server/atp_oauth';

export async function GET({ url }) {
	const oauth = await getOAuthClient();
	const handle = url.searchParams.get('handle');

	const { url: authUrl } = await oauth.authorize({
		target: { type: 'account', identifier: handle },
		state: { returnTo: '/' },
	});

	throw redirect(302, authUrl.toString());
}
