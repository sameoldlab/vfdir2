import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const SERVICE_KIND = v.union(
  v.literal('arena'),
  v.literal('atproto'),
  v.literal('raindrop'),
);

export default defineSchema({
  sessions: defineTable({
    key: v.string(),
  }).index("by_key", ["key"]),

  serviceConnections: defineTable({
    /** device session */
    sessionId: v.id("sessions"),
    service: SERVICE_KIND,
    userId: v.id("users"),
    access_key: v.string(),
    expiresAt: v.optional(v.number())
  })
    .index("by_sessionId_service", ["sessionId", 'service'])
    .index("by_expiresAt", ['expiresAt'])
    .index("by_service_userId", ["service", 'userId']),

  oauthStates: defineTable({
    stateId: v.string(),
    /** device session */
    sessionId: v.id("sessions"),
    service: SERVICE_KIND,
    state: v.string(),
    expiresAt: v.number(),
  }).index("by_stateId", ["stateId"]),

  users: defineTable({
    id: v.union(v.string(), v.number()),
    displayName: v.string(),
    service: SERVICE_KIND,
  }).index('by_uid', ['id']),

  entries: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal('text'), v.literal('media'), v.literal('blob'), v.literal('link'), v.literal('channel')),
    // arena, cosmik, raindrop, filesystem (not auth)
    backing_service: v.string(),
    // reference within service
    service_id: v.union(v.string(), v.number()),
    author: v.id('users'),
    // 'cover art" style metadata for nay entry type
    image: v.optional(v.string()),
    // where was the reference found
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
  })
    .index('by_service_id', ['service_id'])
    .index('by_author', ['author']),


  connections: defineTable({
    p_id: v.id('entries'),
    c_id: v.id('entries'),
    position: v.float64(),
    pinned: v.boolean(),
    connected_at: v.number(),
    connected_by: v.id('users')
  })
    .index('by_parent_child', ['p_id', 'c_id'])
    .index('by_child', ['c_id'])
});
