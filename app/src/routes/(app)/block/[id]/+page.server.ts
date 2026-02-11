// SPDX-License-Identifier: MPL-2.0
import { arenaClient } from "$lib/services/arena/client"
import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/private"
import { api } from "$lib/convex/_generated/api"
import { cvx } from "$lib/server/convex"

export const load: PageServerLoad = async ({ params, fetch, locals }) => {

  if (!!Number(params.id)) {
    const auth = await cvx.query(api.oauth.getServiceConnection, {
      cvx_secret: env.SERVER_SECRET,
      sessionKey: locals.sessionKey,
      service: 'arena'
    })

    const { error, data: block } = await arenaClient.GET('/v3/blocks/{id}', {
      params: {
        header: {
          Authorization: 'Bearer ' + auth?.access_key
        },
        path: { id: Number(params.id) },
      },
      fetch,
    })

    return { block, error }
  }
  error(402, 'invalid block id')
}
