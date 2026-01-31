import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
  type ResolvedActor,
} from "@atcute/identity-resolver"
import { isActorIdentifier } from "@atcute/lexicons/syntax"
import { arenaClient } from "$lib/services/arena/client"
import type { LayoutServerLoad } from "./$types"
import type { ArenaUser } from "$lib/services/arena/types"

type User<U> = {
  key: string,
  name: string
  avatar?: string | null
} & U

export const load: LayoutServerLoad = async ({ params, fetch }): Promise<{
  service: 'arena' | 'raindrop' | 'unknown',
} | {
  service: 'arena',
  user: User<ArenaUser>
} | {
  service: 'atproto',
  user: User<ResolvedActor>
}> => {
  const { username } = params
  if (!isActorIdentifier(username)) {
    const user = await tryArena(params.username!)
    if (user && user.slug === username) {
      return {
        service: 'arena',
        user: {
          ...user,
          key: user.slug,
          name: user.name ?? '',
          avatar: user.avatar,
        }
      }
    }

    return { service: 'unknown' }
  }

  const resolver = new LocalActorResolver({
    handleResolver: new CompositeHandleResolver({
      methods: {
        dns: new DohJsonHandleResolver({
          dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query',
          fetch,
        }),
        http: new WellKnownHandleResolver({
          fetch
        }),
      },
    }),
    didDocumentResolver: new CompositeDidDocumentResolver({
      methods: {
        plc: new PlcDidDocumentResolver({
          fetch
        }),
        web: new WebDidDocumentResolver({
          fetch
        }),
      },
    })
  })
  try {
    const actor = await resolver.resolve(username)
    return {
      user: {
        ...actor,
        name: actor.handle,
        key: actor.did,
      },
      service: 'atproto'
    }
  } catch (err) {
    console.error(err)
    return { service: 'unknown' }
  }
}

async function tryArena(username: string) {
  const { error, data: user } = await arenaClient.GET('/v3/users/{id}', {
    params: {
      path: { id: username }
    }
  })

  if (!user) {
    switch (error.error) {
    }
    console.error(error)
    return undefined
  }

  return user
}

