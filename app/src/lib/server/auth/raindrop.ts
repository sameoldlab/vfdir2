import type { AuthService } from "./types"
import { query } from "../utils/rndrp_api"

const access_req = async (body: {
  client_id: string,
  client_secret: string,
  grant_type: 'authorization_code'
} & ({
  code: string,
  redirect_uri: string,
} | {
  refresh_token: string
})) => {
  let resp = await fetch(`https://raindrop.io/oauth/access_token`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body)
  })

  if (!resp.ok) {
    return resp.json() as Promise<{ error: 'bad_authorization_code' }>
  }

  return resp.json() as Promise<{
    access_token: string
    refresh_token: string
    /** time in seconds. expected to be two weeks */
    expires_in: number,
    token_type: "Bearer"
  }>
}

type RaindropSession = {
  access: string,
  refresh: string,
}

export const newRaindropService = ({ clientId: client_id, clientSecret: client_secret, redirect_uri }: {
  clientId: string,
  clientSecret: string,
  redirect_uri: string,
}): AuthService<'oauth2', RaindropSession> => ({
  name: 'raindrop',
  auth_url: `https://raindrop.io/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}`,
  async callback(params) {
    const code = params.get('code')
    if (!code) {
      throw new Error('No auth code', {
        cause: params.get('error')
      })
    }

    const token = await access_req({
      code,
      client_id,
      redirect_uri,
      client_secret,
      grant_type: 'authorization_code',
    })

    if ('error' in token) {
      throw new Error(`Raindrop Auth Failure ${token.error}`)
    }

    const session = JSON.stringify({
      access: token.access_token,
      refresh: token.refresh_token
    } as RaindropSession)

    const user = await query<{
      result: true,
      user: {
        _id: number,
        fullName: string,
        email: string,
      }
    }>('/user', {
      method: 'GET',
    }, token.access_token)

    if ('error' in user) {
      console.log('Error retreiving user data: ', JSON.stringify(user))
      return {
        session,
        expiresAt: token.expires_in,
        displayName: undefined,
        userId: undefined
      }
    }
    return {
      session,
      expiresAt: token.expires_in,
      displayName: user.user.fullName,
      userId: user.user._id
    }
  },
  async restore(_session) {
    const session: RaindropSession = JSON.parse(_session)

    const user = await query<{
      result: true,
      user: {
        _id: number,
        fullName: string,
        email: string,
      }
    }>('/user', {
      method: 'GET',
    }, session.access)

    if ('error' in user) {
      console.log('Error restoring session: ', JSON.stringify(user))
    }

    return session
  },
  async revoke() { throw new Error('revoke not available for raindrop service') },
  serializeSession: (session) => JSON.stringify(session)
  ,
})
