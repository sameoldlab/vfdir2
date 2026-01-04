import { env as penv } from '$env/dynamic/private'
import { importJwkKey, OAuthClient, OAuthSession, scope, type AuthorizeTarget } from '@atcute/oauth-node-client'
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from '@atcute/identity-resolver';
import { NodeDnsHandleResolver } from '@atcute/identity-resolver-node';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '$lib/convex/_generated/api';
import type { AuthContext, AuthService } from './types';

class ConvexStore<T> {
  constructor(
    private convex: ConvexHttpClient,
    private authApi: typeof api.oauth,
    private type: 'session' | 'state'
  ) { }

  async set(key: string, value: T, ttl?: number) {
    if (this.type === 'state') {
      const expiresAt = ttl ? Date.now() + ttl : Date.now() + 10 * 60 * 1000

      await this.convex.mutation(this.authApi.setAtpState, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key,
        state: JSON.stringify(value),
        expiresAt,
      })
    }
  }

  async get(key: string): Promise<T | null> {
    if (this.type === 'session') {
      const conn = await this.convex.query(
        this.authApi.getServiceConnection, {
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
      const result = await this.convex.query(this.authApi.getAtpState, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key
      })
      if (!result) return null
      return JSON.parse(result) as T
    }
  }

  async delete(key: string) {
    if (this.type === 'state') {
      await this.convex.mutation(this.authApi.deleteAtpStateEXT, {
        cvx_secret: penv.SERVER_SECRET,
        stateId: key
      })
    } else if (this.type === 'session') {
      await this.convex.mutation(this.authApi.deleteServiceConnection, {
        cvx_secret: penv.SERVER_SECRET,
        service: 'atproto',
        sessionKey: key
      })
    }
  }
  async clear() { }
}

export interface AtprotoConfig {
  clientId: string;
  jwksUri: string;
  redirectUri: string;
  privateKeyJwk: string;
}
const initClient = async (ctx: AuthContext) => {
  const DOMAIN = 'https://vfdir.same.supply'
  const keyset = await Promise.all([importJwkKey(penv.PRIVATE_KEY_JWK)])
  return new OAuthClient({
    metadata: {
      client_name: 'vfdir',
      logo_uri: `${DOMAIN}/iconx32.png`,
      client_id: `${DOMAIN}/oauth-client-metadata.json`,
      redirect_uris: [`${DOMAIN}/oauth/atproto/callback`],
      scope: [
        // scope.include({ nsid: 'cosmik.network', aud: 'did:web:cosmik.network#d' }),
        scope.repo({
          collection: ['cosmik.network.card', 'cosmik.network.collectionLink', 'cosmik.network.collection'],
          action: ['create', 'update']
        }),
        scope.rpc({ lxm: ['com.atproto.moderation.createReport'], aud: '*' }),
        scope.blob({ accept: ['*/*'] }),
      ],
      jwks_uri: `${DOMAIN}/jwks.json`,
    },
    keyset,
    stores: {
      sessions: new ConvexStore(ctx.convex, ctx.authApi, 'session'),
      states: new ConvexStore(ctx.convex, ctx.authApi, 'state'),
    },
    // async requestLock(name, fn) { },
    actorResolver: new LocalActorResolver({
      handleResolver: new CompositeHandleResolver({
        methods: {
          dns: new NodeDnsHandleResolver(),
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

export interface AtpConfig {
  clientId: string;
  jwksUri: string;
  redirectUri: string;
  privateKeyJwk: string;
}

export function newAtpService(config: AtpConfig): AuthService<'atproto', OAuthSession> {
  let client: OAuthClient | null = null
  return {
    name: 'atproto',
    getClient: async (ctx: AuthContext) => client ?? await initClient(ctx),
    authorize: async (ctx, { sessionKey, returnTo, ...opts }) => {
      client = client ?? await initClient(ctx)
      const identifier = opts.identifier
      const serviceUrl = opts.serviceUrl
      const target: AuthorizeTarget = identifier ? {
        type: 'account',
        identifier
      } : {
        type: 'pds',
        serviceUrl
      }

      const { url, stateId } = await client.authorize({
        target,
        state: {
          sessionKey,
          returnTo: returnTo ?? '/accounts'
        }
      })
      return { url: url.toString(), stateId }
    },
    callback: async (ctx, params) => {
      client = client ?? await initClient(ctx)
      const { session } = await client.callback(params)

      return {
        session: JSON.stringify(session),
        userId: session.did,
        displayName: null,
        expiresAt: null
      }
    },
    restore: (sessionData: string) => client.restore((
      JSON.parse(sessionData) as OAuthSession).did
    ),
    revoke: (session: OAuthSession) => session.signOut(),
    serializeSession: (session) => JSON.stringify(session),
  }

}
