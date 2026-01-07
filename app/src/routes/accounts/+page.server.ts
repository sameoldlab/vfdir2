import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const connections = await locals.ctx.convex.query(locals.ctx.authApi.getAllServices, {
    sessionId: locals.deviceUid
  })

  return {
    connections
  }
}
