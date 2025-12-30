// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup sessions",
  { hours: 1 }, // Run every hour
  internal.oauth.cleanupExpired
);

export default crons;
