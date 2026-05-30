// ESM bridge: imports electron/main (the actual built-in module)
// and re-exports it for the CJS main process bundle
import * as electron from 'electron/main'

// Make available globally for CJS modules
globalThis.__electron_bridge__ = electron

// Also patch require cache so require('electron') returns the API
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Module = require('module')
const electronResolvePath = Module._resolveFilename('electron', module)
Module._cache[electronResolvePath] = { exports: electron }

console.log('[electron-bridge] Electron APIs loaded:', typeof electron.app)
