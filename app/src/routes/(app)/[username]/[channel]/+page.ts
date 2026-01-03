// SPDX-License-Identifier: MPL-2.0

import { browser } from "$app/environment"
import type { PageLoad } from "./$types"

export const load: PageLoad = ({ params }) => {
  if (!browser) return {}
  import("$lib/services/arena/arenav2").then(({ getBlocks }) => {
    console.log('echo', params)
    getBlocks(params.channel)
  })
  return {}
}
