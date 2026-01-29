// SPDX-License-Identifier: MPL-2.0

import { createContext } from "svelte";
import type { NavigationTarget } from "@sveltejs/kit";
import type { ArenaUser } from "./services/arena/types";
import type { ResolvedActor } from "@atcute/identity-resolver";

export const VIEWS = ['block', 'miller', 'table', 'canvas'] as const
export type VIEWS = typeof VIEWS[number]

type TreeNode = NavigationTarget
export const [getTree, setTree] = createContext<TreeNode[]>()

export type RouteCtx = {
  user: ArenaUser,
  service: 'arena',
} | {
  user: ResolvedActor,
  service: 'atproto',
} | {
  service: 'raindrop',
}
export const [getRouteCtx, setRouteCtx] = createContext<RouteCtx>()
