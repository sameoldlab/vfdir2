// SPDX-License-Identifier: MPL-2.0

/// <reference types="@sveltejs/kit" />

import type { Did } from "@atcute/lexicons"
import type { OAuthSession } from "@atcute/oauth-node-client"

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		interface Locals {
			user?: OAuthSession[]
			did?: Did
		}
		// interface Platform {}
		// interface Session {}
		// interface Stuff {}
	}
}

