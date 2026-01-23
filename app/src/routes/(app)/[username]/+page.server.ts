import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
  type ResolvedActor
} from "@atcute/identity-resolver"
import type { PageServerLoad } from "./$types"
import { isActorIdentifier } from "@atcute/lexicons/syntax"
import { NodeDnsHandleResolver } from "@atcute/identity-resolver-node"
import { arenaClient } from "$lib/services/arena/client"

export const load: PageServerLoad = async ({ params }): Promise<{
  service: 'arena' | 'raindrop' | 'unknown',
} | {
  service: 'arena',
  error: object,
  contents: object
} | {
  service: 'atproto',
  actor: ResolvedActor
}> => {
  const { username } = params
  if (!isActorIdentifier(username)) {
    const { error, data: contents } = await arenaClient.GET('/v3/users/{id}/contents', {
      params: {
        query: {
          per: 100,
          sort: 'updated_at_asc',
        },
        path: { id: params.username }
      }
    })
    return { service: 'arena', error, contents }
  }

  const resolver = new LocalActorResolver({
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
  try {
    const actor = await resolver.resolve(username)
    return { actor, service: 'atproto' as const }
  } catch (err) {
    console.error(err)
    return { service: 'unknown' }
  }
}
