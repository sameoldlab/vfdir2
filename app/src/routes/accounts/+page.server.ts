import type { PageServerLoad } from "./$types";
import { api } from "$lib/convex/_generated/api";
import { cvx } from "$lib/server/convex";

export const load: PageServerLoad = async ({ locals }) => {
  const connections = await cvx.query(api.oauth.getAllServices, {
    sessionId: locals.sessionKey
  })

  return { connections }
}
