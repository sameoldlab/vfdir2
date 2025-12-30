import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SERVICE_KIND = v.union(
  v.literal('arena'),
  v.literal('atproto'),
);

// Devices
export const getOrCreateDevice = mutation({
  args: { uid: v.string() },
  handler: async (ctx, { uid }) => {
    const existing = await ctx.db
      .query('devices')
      .withIndex('by_uid', (q) => q.eq('uid', uid))
      .first()

    if (existing) return existing._id;

    return await ctx.db.insert('devices', { uid })
  },
})

export const getDevice = query({
  args: { uid: v.string() },
  handler: async (ctx, { uid }) => {
    return await ctx.db
      .query('devices')
      .withIndex('by_uid', (q) => q.eq('uid', uid))
      .first()
  },
})

// Connections
export const getServiceConnection = query({
  args: {
    deviceId: v.id("devices"),
    service: SERVICE_KIND,
  },
  handler: async (ctx, { deviceId, service }) => {
    const connection = await ctx.db
      .query("serviceConnections")
      .withIndex("by_deviceId_service", (q) =>
        q.eq("deviceId", deviceId).eq("service", service)
      )
      .first();

    if (!connection) return null;

    // Check if expired
    if (connection.expiresAt && connection.expiresAt < Date.now()) {
      return null;
    }

    return {
      userId: connection.userId,
      displayName: connection.displayName,
      session: connection.session,
    };
  },
});

export const getAllServiceConnections = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, { deviceId }) => {
    const connections = await ctx.db
      .query("serviceConnections")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .collect();

    const now = Date.now();
    return connections
      .filter(c => !c.expiresAt || c.expiresAt > now)
      .map(c => ({
        service: c.service,
        userId: c.userId,
        displayName: c.displayName,
      }));
  },
});

export const setServiceConnection = mutation({
  args: {
    deviceId: v.id("devices"),
    service: SERVICE_KIND,
    userId: v.string(),
    displayName: v.string(),
    session: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { deviceId, service } = args;

    const existing = await ctx.db
      .query("serviceConnections")
      .withIndex("by_deviceId_service", (q) =>
        q.eq("deviceId", deviceId).eq("service", service)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        displayName: args.displayName,
        session: args.session,
        expiresAt: args.expiresAt,
      });
    } else {
      await ctx.db.insert("serviceConnections", {
        deviceId,
        service: args.service,
        userId: args.userId,
        displayName: args.displayName,
        session: args.session,
        expiresAt: args.expiresAt,
      });
    }
  },
});

export const deleteServiceConnection = mutation({
  args: {
    deviceId: v.id("devices"),
    service: SERVICE_KIND,
  },
  handler: async (ctx, { deviceId, service }) => {
    const connection = await ctx.db
      .query("serviceConnections")
      .withIndex("by_deviceId_service", (q) =>
        q.eq("deviceId", deviceId).eq("service", service)
      )
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

/** Find other devices that have this service connected */
export const findRelatedConnections = query({
  args: {
    currentDeviceId: v.id("devices"),
    service: SERVICE_KIND,
    userId: v.string(),
  },
  handler: async (ctx, { currentDeviceId, service, userId }) => {
    // Find all devices with this service account
    const connections = await ctx.db
      .query("serviceConnections")
      .withIndex("by_service_userId", (q) =>
        q.eq("service", service).eq("userId", userId)
      )
      .collect();

    // Get all other services connected on those devices (excluding current device)
    const suggestions = new Map<string, { service: string; displayName: string }>();

    for (const conn of connections) {
      if (conn.deviceId === currentDeviceId) continue;

      const otherServices = await ctx.db
        .query("serviceConnections")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", conn.deviceId))
        .collect();

      for (const other of otherServices) {
        if (other.service !== service && !other.expiresAt || (other.expiresAt && other.expiresAt > Date.now())) {
          suggestions.set(other.service, {
            service: other.service,
            displayName: other.displayName,
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

export const getOAuthState = query({
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
      service: state.service,
      deviceId: state.deviceId,
      state: state.state,
    };
  },
});

export const setOAuthState = mutation({
  args: {
    stateId: v.string(),
    service: SERVICE_KIND,
    deviceId: v.id("devices"),
    state: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const stateId = await ctx.db.insert("oauthStates", {
      stateId: args.stateId,
      service: args.service,
      deviceId: args.deviceId,
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
