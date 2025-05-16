// src/tests/vitejs.server.config.ts
// ✔ Type-check that the Vite config is importable
//   and expose a port number for any other tests.

import config from '../../vite.config'

// narrow the type a bit so TS is satisfied
type ViteConfig = {
  server?: { port?: number }
}

const cfg = config as ViteConfig
export const port = cfg.server?.port ?? 5173  // fall back to default dev port
