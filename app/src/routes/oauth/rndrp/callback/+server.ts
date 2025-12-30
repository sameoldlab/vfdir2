import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const code = url.searchParams.get('code');
	let req = await fetch(`https://raindrop/oauth/access_token`, {
		method: 'POST',
		body: JSON.stringify({
			code,
			client_id: import.meta.env.VITE_RNDRP_CLIENT_ID,
			client_secret: env.RNDRP_CLIENT_SECRET,
			redirect_url: import.meta.env.VITE_RNDRP_CALLBACK_URL,
		})
	})


	if (!req.ok) error(502)
	const json: Response = await req.json()
	if ('error' in json) {
		error(502, json.error)
	}
	console.log(json)
	redirect(302, '/');
}

type Response = {
	access_token: string
	refresh_token: string
	/**
		* in milliseconds
		* @deprecated use expires_in
		*/
	expires: 1209599768,
	/** in seconds, use this instead */
	expires_in: 1209599,
	token_type: "Bearer"
} | {
	error: 'bad_authorization_code'
}

