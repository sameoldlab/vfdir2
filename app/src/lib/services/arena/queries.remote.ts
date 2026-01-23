import { query } from "$app/server";
import { type } from 'arktype'
import { arenaClient } from "./client";

export const userContents = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => arenaClient.GET('/v3/users/{id}/contents', {
  params: {
    query: {
      per: 100,
      page,
    },
    path: { id }
  }
})
)

export const channelContents = query(type({
  id: 'string',
  page: 'number'
}), async ({ id, page }) => arenaClient.GET('/v3/channels/{id}/contents', {
  params: {
    query: {
      per: 100,
      page,
    },
    path: { id }
  }
})
)
