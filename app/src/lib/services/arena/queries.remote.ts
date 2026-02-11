import { getRequestEvent, query } from "$app/server";
import { type } from 'arktype'
import { arenaClient } from "./client";
import { env } from "$env/dynamic/private";
import { cvx } from "$lib/server/convex";
import { api } from "$lib/convex/_generated/api";

export const getUserChannels = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => {
  const token = await getToken()
  const resp = await arenaClient.GET('/v3/users/{id}/contents', {
    params: {
      header: {
        Authorization: 'Bearer ' + token
      },
      query: {
        per: 100,
        page,
        sort: "updated_at_desc",
        type: 'Channel'
      },
      path: { id }
    }
  })
  // remove nonserializable response from return value
  return { ...resp, response: null }
}
)

export const getChannelContents = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => {
  const token = await getToken()
  const resp = await arenaClient.GET('/v3/channels/{id}/contents', {
    params: {
      header: {
        Authorization: 'Bearer ' + token
      },
      query: {
        per: 100,
        page,
        sort: "updated_at_desc",
      },
      path: { id }
    }
  })
  // remove nonserializable response from return value
  return { ...resp, response: null }
}
)

async function getToken() {
  const { locals } = getRequestEvent()

  const auth = await cvx.query(api.oauth.getServiceConnection, {
    cvx_secret: env.SERVER_SECRET,
    sessionKey: locals.sessionKey,
    service: 'arena'
  })

  return auth?.access_key
}
