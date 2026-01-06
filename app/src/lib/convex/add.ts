import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";


const SERVICE_KIND = v.union(
  v.literal('arena'),
  v.literal('atproto'),
  v.literal('raindrop'),
);

export const get_or_create_user = internalMutation({
  args: {
    user: v.union(v.object({
      displayName: v.string(),
      id: v.string(),
    }), v.id('users')),
    service: SERVICE_KIND
  },
  async handler(ctx, { user, service }) {
    if (typeof user === 'object') {
      const existing = await ctx.db.query('users').withIndex("by_uid", q => q.eq("id", user.id)).unique()
      if (!existing) {
        const newId = await ctx.db.insert('users', {
          id: user.id,
          displayName: user.displayName,
          service,
        })
        return newId
      }
      return existing._id
    }
    let existing = await ctx.db.get(user)
    if (existing)
      return existing._id
  },
})

export const addEntries = mutation({
  args: {
    entries: v.array(v.object({
      user: v.object({
        displayName: v.string(),
        id: v.string(),
      }),
      title: v.string(),
      description: v.string(),
      type: v.union(v.literal('text'), v.literal('media'), v.literal('blob'), v.literal('link'), v.literal('channel')),
      /** arena, cosmik, raindrop, filesystem (not auth) */
      backing_service: v.string(),
      /** reference within service */
      service_id: v.union(v.string(), v.number()),
      /** 'cover art" style metadata for nay entry type */
      image: v.optional(v.string()),
      /** where was the reference found */
      source: v.optional(v.string()),
      created_at: v.number(),
      updated_at: v.number(),

      // =========== TYPE SPECIFIC ==========
      // entry content for a 'note' block
      content: v.optional(v.string()),
      filename: v.optional(v.string()),
      // entry content for a 'media' block
      media: v.optional(v.string()),
      // blob / attachment uri
      blob: v.optional(v.string()),
      // best effort match to service type 
      status: v.optional(v.union(v.literal('public'), v.literal('closed'), v.literal('private'))),
      // last_sync
    })),
    service: SERVICE_KIND
  },
  handler: async (ctx, { entries, service }) => {
    return await Promise.all(entries.map(async ({ user, ...e }): Promise<{
      user: [string, Id<'users'>]
      entry: [string | number, Id<'entries'>]
    } | null> => {
      let authorId: Id<'users'> | null = await ctx.runMutation(internal.add.get_or_create_user, {
        service,
        user,
      })
      if (!authorId) return null

      let oldEntry = await ctx.db.query('entries').withIndex('by_service_id', q => q.eq(
        'backing_service', e.backing_service).eq('service_id', e.service_id)).unique()
      if (oldEntry) {
        ctx.db.patch('entries', oldEntry._id, {
          ...e,
          author: authorId,
        })
        return {
          user: [user.id, authorId],
          entry: [e.service_id, oldEntry._id]
        }
      }
      // [e.service_id, authorId, oldEntry._id] as const


      const entryId = await ctx.db
        .insert('entries', {
          ...e,
          author: authorId,
        })
      return {
        user: [user.id, authorId],
        entry: [e.service_id, entryId]
      } as const
    }))
  },
});


export const connectEntry = mutation({
  args: {
    pid: v.union(v.string(), v.id('entries')),
    cid: v.union(v.string(), v.id('entries')),
    service: SERVICE_KIND,
    position: v.optional(v.float64()),
    pinned: v.optional(v.boolean()),
    connected_at: v.number(),
    connected_by: v.union(v.object({
      displayName: v.string(),
      id: v.string(),
    }), v.id('users')),
  },
  handler: async (ctx, { pid, cid, service, position, pinned, connected_at, connected_by }) => {

    let userId: Id<'users'> | null = await ctx.runMutation(internal.add.get_or_create_user, {
      service,
      user: connected_by
    })
    if (!userId) throw Error(`user not found: ${connected_by}`)

    const p = await ctx.db.query('entries')
      .withIndex("by_service_id", q => q
        .eq("backing_service", service).eq('service_id', pid)
      ).unique()
    const p_id = p ?? (ctx.db.normalizeId('entries', pid) && await ctx.db.get(pid as Id<'entries'>))

    const c = await ctx.db.query('entries')
      .withIndex("by_service_id", q => q
        .eq("backing_service", service).eq('service_id', cid)
      )
      .unique()
    const c_id = c ?? (ctx.db.normalizeId('entries', cid) && await ctx.db.get(cid as Id<'entries'>))

    if (!p_id) throw Error(`pid not found: ${pid}`)
    if (!c_id) throw Error(`cid not found: ${cid}`)

    const existing = await ctx.db
      .query('connections').withIndex("by_parent_child", q => q.eq("p_id", p_id._id).eq("c_id", c_id._id)).unique()
    if (existing) {
      return existing._id
    }
    const id: Id<'connections'> = await ctx.db
      .insert('connections', {
        p_id: p_id._id,
        c_id: c_id._id,
        position: position ?? Infinity,
        pinned: pinned ?? false,
        connected_at,
        connected_by: userId
      })
    return id
  },
})
