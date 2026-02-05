// SPDX-License-Identifier: MPL-2.0
import { arenaClient } from "$lib/services/arena/client"
import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
  if (!!Number(params.id)) {
    // locals.
    const { error, data: block } = await arenaClient.GET('/v3/blocks/{id}', {
      params: {
        path: { id: Number(params.id) },

      },
      fetch,
    })

    return { block, error }
  }
  error(402, 'invalid block id')
}
