import { env } from "$env/dynamic/public";
import { ConvexHttpClient } from "convex/browser";

export const cvx = new ConvexHttpClient(env.PUBLIC_CONVEX_URL)
