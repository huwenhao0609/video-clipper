import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

function getTempBaseDir(): string {
  return join(app.getPath('userData'), 'temp')
}

function ensureTempDir(): string {
  const dir = getTempBaseDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function createTempPath(extension: string = '.mp4'): string {
  const dir = ensureTempDir()
  return join(dir, `${uuidv4()}${extension}`)
}

export function getTempDir(): string {
  return ensureTempDir()
}

export async function cleanupTempFiles(maxAgeMs: number = 3600000): Promise<void> {
  const fs = await import('fs/promises')
  const dir = ensureTempDir()
  const now = Date.now()

  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = join(dir, file)
      try {
        const stats = await fs.stat(filePath)
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath)
        }
      } catch {
        // ignore individual file errors
      }
    }
  } catch {
    // ignore directory errors
  }
}
