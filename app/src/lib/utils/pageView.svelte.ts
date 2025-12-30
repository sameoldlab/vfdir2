// SPDX-License-Identifier: MPL-2.0

import { browser } from "$app/environment"
import { VIEWS } from "$lib/stores.svelte"

const Pv = () => {
  if (browser) {
    if (!localStorage.getItem('pageview'))
      localStorage.setItem('pageview', VIEWS[0])
  }
  let val: VIEWS = $state(browser ? localStorage.getItem('pageview') : VIEWS[0])
  return {
    get v() {
      return val
    },
    set v(newVal: VIEWS) {
      localStorage.setItem('pageview', newVal)
      val = localStorage.getItem('pageview')
    }
  }
}
export const pageview = Pv()
