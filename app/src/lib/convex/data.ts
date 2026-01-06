import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { mergedStream, stream } from "convex-helpers/server/stream";
import schema from "./schema";
import { Id } from "./_generated/dataModel";
import { customQuery } from "convex-helpers/server/customFunctions";

export const queryWithSession = customQuery(query, {
  args: { sessionId: v.string() },
  input: async (ctx, { sessionId }) => {
    const session = await ctx.db.query('sessions')
      .withIndex('by_key', q => q.eq("key", sessionId))
      .unique()
    if (!session) throw new Error('no session found')

    const now = Date.now()
    const services = (await ctx.db.query('serviceConnections')
      .withIndex('by_sessionId_service', q => q.eq("sessionId", session._id))
      .filter(q => q.or(q.neq(q.field('expiresAt'), undefined), q.gt(q.field('expiresAt'), now)))
      .collect()).map(s => ({
        user: s.userId,
        service: s.service
      }))

    return {
      ctx: { ...ctx, services },
      args: {}
    }
  },
})

export const get = queryWithSession({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first()
  },
})

export const get_entry = query({
  args: {
    key: v.string(),
    service: v.string()
  },
  handler: async (ctx, { key, service }) => {
    return await ctx.db
      .query('entries')
      .withIndex('by_service_id', (q) => q.eq('backing_service', service).eq('service_id', key))
      .filter((q) => q.eq(q.field('type'), 'group'))
      .unique()
  },
})

export const get_user_entries = query({
  args: {
    userId: v.union(v.string(), v.number()),
    pagination: paginationOptsValidator
  },
  handler: async (ctx, { pagination, userId }) => {
    const user = await ctx.db.query('users').withIndex("by_uid", q => q.eq('id', userId)).unique()
    if (!user) return []

    return (await ctx.db
      .query('entries')
      .withIndex('by_author', q => q.eq('author', user._id))
      .order("asc")
      .filter((q) => q.neq(q.field('status'), 'private'))
      .collect()).map(q => ({
        ...q,
        key: q.service_id,
        author: {
          key: user.id,
          displayName: user.displayName
        }
      }))
  },
})

export const get_my_entries = query({
  args: {
    sessionKey: v.string(),
    pagination: paginationOptsValidator
  },
  handler: async (ctx, { pagination, sessionKey }) => {
    const session = await ctx.db.query('sessions')
      .withIndex('by_key', q => q.eq("key", sessionKey))
      .unique()
    if (!session) return null

    const services = await ctx.db.query('serviceConnections')
      .withIndex('by_sessionId_service', q => q.eq("sessionId", session._id))
      .collect()
    const users = [...new Set(services.map(c => c.userId))]
    if (users.length === 0) return

    // const user_entries = (user: Id<'users'>) => stream(ctx.db, schema).query('entries').withIndex('by_author', q => q.eq('author', user)

    // const entries = (user: Id<'users'>) => stream(ctx.db, schema).query('entries').filterWith(async (q) =>
    //   q.status !== 'private' || q.author == user
    // )
    const entries = (user: Id<'users'>) => stream(ctx.db, schema).query('entries')
      .withIndex('by_author', q => q.eq('author', user))

    const merged = mergedStream(
      users.map(entries), []
    )

    return await merged.paginate(pagination)
  },
})
