// SPDX-License-Identifier: MPL-2.0

/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // production
  readonly ARENA_CLIENT_SECRET: string
  readonly VITE_ARENA_CLIENT_ID: string
  readonly VITE_ARENA_CALLBACK_URL: string
  readonly RNDRP_CLIENT_SECRET: string
  readonly VITE_RNDRP_CLIENT_ID: string
  readonly VITE_RNDRP_CALLBACK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
