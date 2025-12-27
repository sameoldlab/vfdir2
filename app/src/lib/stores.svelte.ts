// SPDX-License-Identifier: MPL-2.0

import { createContext } from "svelte";
import type { NavigationTarget } from "@sveltejs/kit";

export const VIEWS = ['block', 'miller', 'table', 'canvas'] as const
export type VIEWS = typeof VIEWS[number]

type TreeNode = NavigationTarget
export const [getTree, setTree] = createContext<TreeNode[]>()
