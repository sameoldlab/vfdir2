import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { queryWithSession } from "./data";

const SERVICE_KIND = v.union(
  v.literal('arena'),
  v.literal('atproto'),
  v.literal('raindrop'),
);

const serverMutate = customMutation(mutation, {
  args: { cvx_secret: v.string() },
  input: async (ctx, { cvx_secret }) => {

    if (cvx_secret !== process.env.SERVER_SECRET) throw new Error(`server only function. got value ${cvx_secret} expected ${process.env.CLIENT_SECRET} `)
    return {
      ctx,
      args: {}
    }
  },
})

const serverQuery = customQuery(query, {
  args: { cvx_secret: v.string() },
  input: async (ctx, { cvx_secret }) => {
    if (cvx_secret !== process.env.SERVER_SECRET) throw new Error(`server only function. got value ${cvx_secret} expected ${process.env.CLIENT_SECRET} `)
    return {
      ctx,
      args: {}
    }
  },
})

// Sessions
export const createSession = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const existing = await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', key))
      .unique()

    if (existing) return true
    await ctx.db.insert('sessions', { key })
    return true
  },
})

// Connections
export const getServiceConnection = serverQuery({
  args: {
    sessionKey: v.string(),
    service: SERVICE_KIND,
  },
  handler: async (ctx, { sessionKey, service }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', sessionKey))
      .unique()
    if (!session) return { error: 'no such session', code: 404 }

    const connection = await ctx.db
      .query("serviceConnections")
      .withIndex("by_sessionId_service", (q) =>
        q.eq("sessionId", session._id).eq("service", service)
      )
      .first();

    if (!connection) return null;

    // Check if expired
    if (connection.expiresAt && connection.expiresAt < Date.now()) {
      return null;
    }

    return {
      userId: connection.userId,
      access_key: connection.access_key,
    };
  },
});

export const getAllServices = queryWithSession({
  args: {},
  handler: async (ctx) => {
    const connections = await Promise.all(ctx.services.map(async (s) => {
      const u = (await ctx.db.get(s.user))!
      return { service: s.service, userId: u.id, displayName: u.displayName }
    }))

    return connections;
  },
});

export const setServiceConnection = serverMutate({
  args: {
    sessionKey: v.string(),
    service: SERVICE_KIND,
    userId: v.union(v.string(), v.number()),
    displayName: v.string(),
    session: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sessionKey, service } = args
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', sessionKey))
      .first()
    if (!session) return { error: 'no such session', code: 404 }

    const existing = await ctx.db
      .query("serviceConnections")
      .withIndex("by_sessionId_service", (q) =>
        q.eq("sessionId", session._id).eq("service", service)
      )
      .first();

    const userId = await ctx.db.insert('users', {
      displayName: args.displayName,
      id: args.userId,
      service: service
    })

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        access_key: args.session,
        expiresAt: args.expiresAt,
      });
    } else {
      await ctx.db.insert("serviceConnections", {
        sessionId: session._id,
        service: args.service,
        userId,
        access_key: args.session,
        expiresAt: args.expiresAt,
      });
    }
  },
});

export const deleteServiceConnection = serverMutate({
  args: {
    sessionKey: v.id("sessions"),
    service: SERVICE_KIND,
  },
  handler: async (ctx, { sessionKey, service }) => {
    const connection = await ctx.db
      .query("serviceConnections")
      .withIndex("by_sessionId_service", (q) =>
        q.eq("sessionId", sessionKey).eq("service", service)
      )
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

/** Find other sessions that have this service connected */
export const findRelatedConnections = query({
  args: {
    sessionKey: v.id("sessions"),
    service: SERVICE_KIND,
    userId: v.string(),
  },
  handler: async (ctx, { sessionKey, service, userId }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', sessionKey))
      .unique()
    if (!session) return { error: 'no such session', code: 404 }

    const u = await ctx.db.query('users').withIndex("by_uid", q => q.eq('id', userId)).unique()
    if (!u) return { error: 'user not found', code: 404 }

    // Find all sesions with this service account
    const connections = await ctx.db
      .query("serviceConnections")
      .withIndex("by_service_userId", (q) =>
        q.eq("service", service).eq("userId", u._id)
      )
      .collect();

    // Get all other services connected on those sessions (excluding current)
    const suggestions = new Map<string, { service: string; user: { name: string, id: string | number } }>();

    for (const conn of connections) {
      if (conn.sessionId === sessionKey) continue;

      const otherServices = await ctx.db
        .query("serviceConnections")
        .withIndex("by_sessionId_service", (q) => q.eq("sessionId", conn.sessionId))
        .collect();

      for (const other of otherServices) {
        if (other.service !== service && !other.expiresAt || (other.expiresAt && other.expiresAt > Date.now())) {
          const u = await ctx.db.get(other.userId)
          if (u) suggestions.set(other.service, {
            service: other.service,
            user: {
              name: u.displayName ?? '',
              id: u.id
            }
          });
        }
      }
    }

    return Array.from(suggestions.values());
  },
});

// cron hourly
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredConnections = await ctx.db
      .query("serviceConnections")
      .filter((q) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    for (const connection of expiredConnections) {
      await ctx.db.delete(connection._id);
    }
  },
});

// ============================================================================
// OAUTH STATES
// ============================================================================

export const getOAuthState = serverQuery({
  args: { stateId: v.string() },
  handler: async (ctx, { stateId }) => {
    const state = await ctx.db
      .query("oauthStates")
      .withIndex("by_stateId", (q) => q.eq("stateId", stateId))
      .first();

    if (!state) return null;

    if (state.expiresAt < Date.now()) {
      return null;
    }

    return {
      // service: state.service,
      sessionId: state.sessionId,
      state: state.state,
    };
  },
});

export const setOAuthState = serverMutate({
  args: {
    stateId: v.string(),
    service: SERVICE_KIND,
    sessionKey: v.string(),
    state: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_key', (q) => q.eq('key', args.sessionKey))
      .unique()
    if (!session) return { error: 'no such session', code: 404 }

    const stateId = await ctx.db.insert("oauthStates", {
      stateId: args.stateId,
      service: args.service,
      sessionId: session._id,
      state: args.state,
      expiresAt: args.expiresAt,
    });

    // TTL auto delete
    await ctx.scheduler.runAt(args.expiresAt, internal.oauth.deleteOAuthState, {
      stateId,
    });

    return stateId;
  },
});

export const deleteOAuthState = internalMutation({
  args: { stateId: v.id("oauthStates") },
  handler: async (ctx, { stateId }) => {
    const state = await ctx.db.get(stateId);
    if (state) {
      await ctx.db.delete(stateId);
    }
  },
});
