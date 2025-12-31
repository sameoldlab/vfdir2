// SPDX-License-Identifier: MPL-2.0

export const query = async <T>(path: string, options?: RequestInit, auth_token?: string) => {
	if (auth_token) options.headers['Authorization'] = 'Bearer ' + auth_token

	let resp = await fetch(`https://api.raindrop.io/rest/v1${path}`, {
		...options,
		headers: {
			...options.headers,
			'Content-Type': 'application/json',
		},
	})

	if (!resp.ok) {
		try {
			return resp.json() as Promise<{ error: number, errorMessage: string, result: boolean }>
		} catch (_) {
			return { error: resp.statusText }
		}
	}

	return resp.json() as T
}
