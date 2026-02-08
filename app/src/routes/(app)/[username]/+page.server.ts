import type { PageServerLoad } from "./$types"
import { pullCosmik } from "$lib/services/atpro/pullCosmik"
import { error } from "@sveltejs/kit"
import { getUserChannels } from "$lib/services/arena/queries.remote"

export const load: PageServerLoad = async ({ params, parent }) => {
  const data = await parent()

  if (data.service === 'atproto' && data.user) {
    return { contents: pullCosmik(data.user), service: data.service } as const

  } else if (data.service === 'arena' && data.user) {
    const result = await getUserChannels({ id: params.username, page: 1 })
    if (result.error) error(502, JSON.stringify(result.error))

    return { contents: result.data, service: data.service } as const
  }
}
