import { env } from '$env/dynamic/private'
import { importJwkKey, MemoryStore, OAuthClient, scope } from '@atcute/oauth-node-client'
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
import { PUBLIC_CONVEX_URL } from '$env/static/public';

class ConvexStore<T> {
  private getQuery: any;
  private setMutation: any;
  private deleteMutation: any;

  constructor(getQuery: any, setMutation: any, deleteMutation: any) {
    this.getQuery = getQuery;
    this.setMutation = setMutation;
    this.deleteMutation = deleteMutation;
  }

  async get(key: string): Promise<T | null> {
    const result = await convex.query(this.getQuery, {
      [this.getQuery === api.oauth.getSession ? 'did' : 'stateId']: key
    });

    if (!result) return null;

    const data = this.getQuery === api.oauth.getSession ? result.session : result.state;
    return JSON.parse(data);
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = ttl ? Date.now() + ttl : undefined;

    await convex.mutation(this.setMutation, {
      [this.setMutation === api.oauth.setSession ? 'did' : 'stateId']: key,
      [this.setMutation === api.oauth.setSession ? 'session' : 'state']: serialized,
      ...(expiresAt && { expiresAt }),
    });
  }

  async delete(key: string): Promise<void> {
    await convex.mutation(this.deleteMutation, {
      [this.deleteMutation === api.oauth.deleteSession ? 'did' : 'stateId']: key,
    });
  }

  async clear(): Promise<void> {
    // Optional: implement if needed
  }
}
const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)

export const createOAuthClient = async () => new OAuthClient({
  metadata: {
    client_id: 'https://example.com/oauth-client-metadata.json',
    redirect_uris: ['https://example.com/oauth/callback'],
    // scopes; shown here is an example for a full-featured Bluesky client.
    scope: [
      scope.include({
        nsid: 'app.bsky.authFullApp',
        aud: 'did:web:api.bsky.app#bsky_appview',
      }),
      scope.include({
        nsid: 'chat.bsky.authFullChatClient',
        aud: 'did:web:api.bsky.chat#bsky_chat',
      }),

      scope.rpc({ lxm: ['com.atproto.moderation.createReport'], aud: '*' }),
      scope.blob({ accept: ['image/*', 'video/*'] }),
      scope.account({ attr: 'email', action: 'manage' }),
      scope.identity({ attr: 'handle' }),
    ],
    // optional: if set, this must be the URL where you serve `oauth.jwks`.
    // must be same-origin as client_id. if omitted, `oauth.metadata` will inline jwks instead.
    jwks_uri: 'https://example.com/jwks.json',
  },
  keyset: await Promise.all([importJwkKey(env.PRIVATE_KEY_JWK)]),
  stores: {
    sessions: new ConvexStore(api.oauth.getSession, api.oauth.setSession, api.oauth.deleteSession),
    states: new ConvexStore(api.oauth.getState, api.oauth.setState, api.oauth.deleteState),
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

let oauthClientPromise: Promise<OAuthClient> | null = null;

export function getOAuthClient(): Promise<OAuthClient> {
  if (!oauthClientPromise) {
    oauthClientPromise = createOAuthClient();
  }
  return oauthClientPromise;
}
