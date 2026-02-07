// SPDX-License-Identifier: MPL-2.0

import { arenaClient } from "$lib/services/arena/client"
import type { PageServerLoad } from "./$types"
import { env } from "$env/dynamic/private"

export const load: PageServerLoad = async ({ params, fetch, locals, parent }) => {
  try {
    const { service } = await parent()

    if (service === 'arena') {
      const auth = await locals.ctx.convex.query(locals.ctx.authApi.getServiceConnection, {
        cvx_secret: env.SERVER_SECRET,
        sessionKey: locals.sessionKey,
        service
      })

      try {
        const [channel, contents] = await Promise.all([
          arenaClient.GET('/v3/channels/{id}', {
            params: {
              header: {
                Authorization: 'Bearer ' + auth?.access_key
              },
              path: { id: params.channel },
            },
            fetch,
          }),
          arenaClient.GET('/v3/channels/{id}/contents', {
            params: {
              header: {
                Authorization: 'Bearer ' + auth?.access_key
              },
              query: {
                per: 5,
                sort: "updated_at_desc",
              },
              path: { id: params.channel },
            },
            fetch,
          })])

        if (!channel.data && !contents.data) {
          return { channelError: channel.error, contentsError: contents.error }
        }

        return { contents: contents.data, channel: channel.data }
      } catch (err) {
        console.error(`Arena Fetch Error: ${err}`)
        return { error: err }
      }
    }
  } catch (err) {
    console.error(`Server Error: ${err}`)
    return { error: err }
  }
}
