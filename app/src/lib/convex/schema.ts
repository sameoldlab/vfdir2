import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const SERVICE_KIND = v.union(
  v.literal('arena'),
  v.literal('atproto'),
);

export default defineSchema({
  devices: defineTable({
    uid: v.string(),
  }).index("by_uid", ["uid"]),

  serviceConnections: defineTable({
    /** device session */
    deviceId: v.id("devices"),
    service: SERVICE_KIND,
    userId: v.string(),
    displayName: v.string(),
    session: v.string(),
    expiresAt: v.optional(v.number())
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_deviceId_service", ["deviceId", 'service'])
    .index("by_expiresAt", ['expiresAt'])
    .index("by_service_userId", ["service", 'userId']),

  oauthStates: defineTable({
    stateId: v.string(),
    service: SERVICE_KIND,
    /** device session */
    deviceId: v.id("devices"),
    state: v.string(),
    expiresAt: v.number(),
  }).index("by_stateId", ["stateId"]),
});
