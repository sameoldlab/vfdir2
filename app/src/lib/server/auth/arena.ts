import type { AuthService } from "./types"

// no refresh_token or expiry for are.na
type AccessToken = string

const query = async <T>(path: string, options?: RequestInit, accessToken?: string) => {
  if (accessToken) options.headers['Authorization'] = 'Bearer ' + accessToken

  const resp = await fetch(`https://api.are.na/v3${path}`, {
    ...options,
    headers: options?.headers,
  });

  if (!resp.ok) {
    return resp.json() as Promise<{ error: string }>
  }

  return resp.json() as T;
}


export const newArenaService = ({ clientId, clientSecret, redirect_uri }: {
  clientId: string,
  clientSecret: string,
  redirect_uri: string,
}): AuthService<AccessToken> => ({
  name: 'arena',
  auth_url: `https://www.are.na/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code`,
  authorize(ctx, options) {
    return null
  },
  async callback(ctx, params) {
    const code = params.get('code')
    if (!code) {
      throw new Error('No auth code', {
        cause: params.get('error')
      })
    }

    type Success = {
      access_token: string
      token_type: "Bearer"
      // space separated list of abilities
      scope: string,
      created_at: number
    }
    const token = await query<Success>('/oauth/token', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri,
        code: code,
      })
    })

    if ('error' in token) {
      const msg = token as {
        error: string
        error_description: string
      }
      throw new Error(`Arena Auth Failure ${msg.error}\n ${msg.error_description}`)
    }

    const user = await query<{
      id: number,
      type: 'User',
      name: string,
      slug: string,
      // url
      avatar: string
    }>('/me', {
      method: 'GET',
      headers: { accept: 'application/json' }
    }, token.access_token)

    if ('error' in user) {
      console.log('Error retreiving user data: ', JSON.stringify(user))
      return {
        session: token.access_token,
        expiresAt: undefined,
        displayName: undefined,
        userId: undefined
      }
    }
    return {
      session: token.access_token,
      expiresAt: undefined,
      displayName: user.name,
      userId: user.id
    }
  },
  async restore(session) {
    const user = await query<{
      id: number,
      type: 'User',
      name: string,
      slug: string,
      // url
      avatar: string
    }>('/me', {
      method: 'GET',
      headers: { accept: 'application/json' }
    }, session)

    if ('error' in user) {
      console.log('Error restoring session: ', JSON.stringify(user))
    }

    return session
  },
  async revoke() { throw new Error('revoke not available for arena service') },
  serializeSession: (session) => session
  ,
})
