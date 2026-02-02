// SPDX-License-Identifier: MPL-2.0

import { createContext } from "svelte";
import type { NavigationTarget } from "@sveltejs/kit";
import type { ArenaUser } from "./services/arena/types";
import type { ResolvedActor } from "@atcute/identity-resolver";
import type { DbPool } from "./database/connectionPool.svelte";

export const VIEWS = ['block', 'miller', 'table', 'canvas'] as const
export type VIEWS = typeof VIEWS[number]

type TreeNode = NavigationTarget
export const [getTree, setTree] = createContext<TreeNode[]>()

export const [getPool, setPool] = createContext<DbPool>()

type User<U = {}> = {
  key: string,
  name: string
} & U

export type RouteCtx = {
  user: User<ArenaUser>,
  service: 'arena',
} | {
  user: User<ResolvedActor>,
  service: 'atproto',
} | {
  service: 'raindrop',
  user: User,
}
export const [getRouteCtx, setRouteCtx] = createContext<RouteCtx>()
