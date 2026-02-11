import { env as penv } from '$env/dynamic/private'
import { importJwkKey, OAuthClient, OAuthResolverError, OAuthSession, scope, type AuthorizeTarget } from '@atcute/oauth-node-client'
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from '@atcute/identity-resolver';
import { api } from '$lib/convex/_generated/api';
import type { AuthContext, AuthService } from './types';
import { cvx } from '../convex';

class ConvexStore<T> {
  constructor(
    private type: 'session' | 'state'
  ) { }

  async set(key: string, value: T, ttl?: number) {
    if (this.type === 'state') {
      const expiresAt = ttl ? Date.now() + ttl : Date.now() + 10 * 60 * 1000

      await cvx.mutation(api.oauth.setAtpState, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key,
        state: JSON.stringify(value),
        expiresAt,
      })
    }
  }

  async get(key: string): Promise<T | null> {
    if (this.type === 'session') {
      const conn = await cvx.query(
        api.oauth.getServiceConnection, {
        cvx_secret: penv.SERVER_SECRET,
        service: 'atproto',
        sessionKey: key
      }
      )
      if (!conn) return null
      if ('error' in conn) {
        console.error('Error retrieving connections: ', conn)
        return null
      }
      return JSON.parse(conn.access_key) as T

    } else if (this.type === 'state') {
      const result = await cvx.query(api.oauth.getAtpState, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key
      })
      if (!result) return null
      return JSON.parse(result) as T
    }
  }

  async delete(key: string) {
    if (this.type === 'state') {
      await cvx.mutation(api.oauth.deleteAtpStateEXT, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key
      })
    } else if (this.type === 'session') {
      await cvx.mutation(api.oauth.deleteServiceConnection, {
        cvx_secret: penv.SERVER_SECRET,
        service: 'atproto',
        sessionKey: key
      })
    }
  }
  async clear() { }
}

export interface AtpConfig {
  client_name: string
  domain: string
}

const initClient = async (ctx: AuthContext, { domain, client_name }: AtpConfig) => {
  const keyset = await Promise.all([importJwkKey(JSON.parse(penv.KEY_JWK))])
  return new OAuthClient({
    metadata: {
      client_name,
      logo_uri: `${domain}/iconx32.png`,
      client_id: `${domain}/oauth-client-metadata.json`,
      redirect_uris: [`${domain}/oauth/atproto/callback`],
      jwks_uri: `${domain}/jwks.json`,
      scope: [
        // scope.include({ nsid: 'cosmik.network', aud: 'did:web:cosmik.network#d' }),
        scope.repo({
          collection: ['cosmik.network.card', 'cosmik.network.collectionLink', 'cosmik.network.collection'],
          action: ['create', 'update']
        }),
        scope.blob({ accept: ['*/*'] }),
      ],
    },
    keyset,
    stores: {
      sessions: new ConvexStore('session'),
      states: new ConvexStore('state'),
    },
    // async requestLock(name, fn) { },
    actorResolver: new LocalActorResolver({
      handleResolver: new CompositeHandleResolver({
        methods: {
          dns: new DohJsonHandleResolver({
            dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query',
          }),
          http: new WellKnownHandleResolver(),
        },
      }),
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: {
          plc: new PlcDidDocumentResolver(),
          web: new WebDidDocumentResolver(),
        },
      })
    })
  })
}


export function newAtpService(config: AtpConfig): AuthService<'atproto', OAuthSession> {
  let client: OAuthClient | null = null
  return {
    name: 'atproto',
    getClient: async (ctx: AuthContext) => client ?? await initClient(ctx, config),
    authorize: async (ctx, { sessionKey, returnTo, target }) => {
      client = client ?? await initClient(ctx, config)
      console.log('authorizing...')
      // const { url, stateId } = await
      return client.authorize({
        target,
        state: {
          sessionKey,
          returnTo: returnTo ?? '/accounts'
        },
      }).then(({ url, stateId }) => {
        return { url: url.toString(), stateId }
      }).catch(e => {
        if (e instanceof OAuthResolverError) {
          console.error(e.cause)
          console.trace(e.stack)
          throw e
        }
      })
      // return { url: url.toString(), stateId }
    },
    callback: async (ctx, params) => {
      client = client ?? await initClient(ctx, config)
      const { session } = await client.callback(params)

      return {
        session: JSON.stringify(session),
        userId: session.did,
        displayName: session.handle,
        expiresAt: (await session.getTokenInfo()).expiresAt?.valueOf()
      }
    },
    restore: (sessionData: string) => client.restore((
      JSON.parse(sessionData) as OAuthSession).did
    ),
    revoke: (session: OAuthSession) => session.signOut(),
    serializeSession: (session) => JSON.stringify(session),
  }

}
