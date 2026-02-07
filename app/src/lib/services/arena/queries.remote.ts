import { query } from "$app/server";
import { type } from 'arktype'
import { arenaClient } from "./client";

export const getUserChannels = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => arenaClient.GET('/v3/users/{id}/contents', {
  params: {
    query: {
      per: 100,
      page,
      sort: "updated_at_desc",
      type: 'Channel'
    },
    path: { id }
  }
})
)

export const getChannelContents = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => arenaClient.GET('/v3/channels/{id}/contents', {
  params: {
    query: {
      per: 100,
      page,
      sort: "updated_at_desc",
    },
    path: { id }
  }
})
)

