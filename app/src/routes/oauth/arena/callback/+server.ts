import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const code = url.searchParams.get('code');

	const req = await fetch(`https://dev.are.na/oauth/token
   ?client_id=${import.meta.env.VITE_ARENA_CLIENT_ID}
   &client_secret=${env.ARENA_CLIENT_SECRET}
   &code=${code}
   &grant_type=authorization_code
   &redirect_uri=${import.meta.env.VITE_ARENA_CALLBACK_URL}`)

	if (!req.ok) error(502)
	const json = await req.json()
	console.log(json)

	redirect(302, '/');
}
