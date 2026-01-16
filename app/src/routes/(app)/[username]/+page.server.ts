import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver
} from "@atcute/identity-resolver"
import type { PageServerLoad } from "./$types"
import { isActorIdentifier } from "@atcute/lexicons/syntax"

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { username } = params
  if (!isActorIdentifier(username)) return

  const resolver = new LocalActorResolver({
    handleResolver: new CompositeHandleResolver({
      methods: {
        dns: new DohJsonHandleResolver({ dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query', fetch }),
        http: new WellKnownHandleResolver({ fetch }),
      },
    }),
    didDocumentResolver: new CompositeDidDocumentResolver({
      methods: {
        plc: new PlcDidDocumentResolver({ fetch }),
        web: new WebDidDocumentResolver({ fetch }),
      },
    })
  })
  try {
    const actor = await resolver.resolve(username)
    return { actor }
  } catch (err) {
    console.error(err)
  }
}
