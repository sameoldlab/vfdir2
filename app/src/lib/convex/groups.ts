import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const add = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal('public'), v.literal('closed'), v.literal('private'))),
    sessionKey: v.string()
  },
  handler: async (ctx, { sessionKey: key }) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();
  },
});

export const get_pulse = query({
  args: {
    sessionKey: v.string(),
    pagination: paginationOptsValidator
  },
  handler: async (ctx, { sessionKey, pagination }) => {
    const session = await ctx.db.query('sessions')
      .withIndex('by_key', q => q.eq("key", sessionKey))
      .unique()
    if (!session) return null

    // public private distiction __currently__ only matter with are.na.
    const arena_session = await ctx.db.query('serviceConnections')
      .withIndex('by_sessionId_service', q => q.eq("sessionId", session._id).eq("service", 'arena'))
      .unique()
    // TODO: handle private collaborative groups where the owner is not the current user

    return await ctx.db
      .query('entries')
      .filter((q) => q.and(
        q.eq(q.field('type'), 'channel'),
        q.or(
          q.neq(q.field('status'), 'private'),
          q.eq(q.field('author'), arena_session?.userId)
        )
      ))
      .paginate(pagination)
  },
})

export const get_contents = query({
  args: {
    sessionKey: v.string(),
    key: v.union(v.string(), v.number()),
    pagination: paginationOptsValidator
  },
  handler: async (ctx, { key: service_id, pagination }) => {
    return await ctx.db
      .query('entries')
      .filter((q) => q.eq(q.field('type'), 'channel'))
      .withIndex('by_service_id', (q) => q.eq('service_id', service_id))
      .paginate(pagination)
  },
})
