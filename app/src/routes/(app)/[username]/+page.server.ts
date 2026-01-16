import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver
} from "@atcute/identity-resolver"
import type { PageServerLoad } from "./$types"
import { isActorIdentifier } from "@atcute/lexicons/syntax"
import { NodeDnsHandleResolver } from "@atcute/identity-resolver-node"

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { username } = params
  if (!isActorIdentifier(username)) return

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
    return { actor }
  } catch (err) {
    console.error(err)
  }
}
