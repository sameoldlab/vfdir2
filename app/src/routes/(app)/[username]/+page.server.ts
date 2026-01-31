import type { PageServerLoad } from "./$types"
import { arenaClient } from "$lib/services/arena/client"
import { pullCosmik } from "$lib/services/atpro/pullCosmik"
import { error } from "@sveltejs/kit"

export const load: PageServerLoad = async ({ params, parent }) => {
  const data = await parent()

  if (data.service === 'atproto' && data.user) {
    return { contents: pullCosmik(data.user) }

  } else if (data.service === 'arena' && data.user) {
    const result = await arenaClient.GET('/v3/users/{id}/contents', {
      params: {
        query: { per: 100, sort: 'updated_at_asc' },
        path: { id: params.username }
      }
    })
    if (result.error) error(502, JSON.stringify(result.error))

    return { contents: result.data.data }
  }
}
