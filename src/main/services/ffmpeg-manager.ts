import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { spawn } from 'child_process'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'

let ffmpegPath: string | null = null
let ffprobePath: string | null = null
let downloadPromise: Promise<void> | null = null

function getFFmpegBaseDir(): string {
  return join(app.getPath('userData'), 'ffmpeg')
}

export function getFFmpegPath(): string | null {
  if (ffmpegPath && existsSync(ffmpegPath)) return ffmpegPath
  const defaultPath = join(getFFmpegBaseDir(), 'ffmpeg.exe')
  if (existsSync(defaultPath)) {
    ffmpegPath = defaultPath
    return ffmpegPath
  }
  return null
}

export function getFfprobePath(): string | null {
  if (ffprobePath && existsSync(ffprobePath)) return ffprobePath
  const defaultPath = join(getFFmpegBaseDir(), 'ffprobe.exe')
  if (existsSync(defaultPath)) {
    ffprobePath = defaultPath
    return ffprobePath
  }
  return null
}

export function isFFmpegReady(): boolean {
  return getFFmpegPath() !== null && getFfprobePath() !== null
}

export async function ensureFFmpeg(): Promise<{ ready: boolean; status: string }> {
  if (isFFmpegReady()) {
    return { ready: true, status: 'FFmpeg 已就绪' }
  }

  const baseDir = getFFmpegBaseDir()
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }

  // Check for system-installed FFmpeg
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', ['-version'])
      proc.on('close', (code) => {
        if (code === 0) {
          ffmpegPath = 'ffmpeg'
          ffprobePath = 'ffprobe'
          resolve()
        } else {
          reject(new Error('System ffmpeg not found'))
        }
      })
      proc.on('error', reject)
    })
    return { ready: true, status: '使用系统 FFmpeg' }
  } catch {
    // System FFmpeg not found, need to download
  }

  return { ready: false, status: 'FFmpeg 未安装，需要下载' }
}

export async function downloadFFmpeg(onProgress?: (percent: number, eta: string) => void): Promise<void> {
  if (downloadPromise) return downloadPromise

  downloadPromise = (async () => {
    const baseDir = getFFmpegBaseDir()
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true })
    }

    const ffmpegExePath = join(baseDir, 'ffmpeg.exe')
    const ffprobeExePath = join(baseDir, 'ffprobe.exe')

    // For now, check if user manually placed ffmpeg in the directory
    if (existsSync(ffmpegExePath) && existsSync(ffprobeExePath)) {
      ffmpegPath = ffmpegExePath
      ffprobePath = ffprobeExePath
      onProgress?.(100, '0s')
      return
    }

    // TODO: Implement actual download from BtbN/FFmpeg-Builds GitHub releases
    // For now, throw a helpful error
    throw new Error(
      'FFmpeg 未找到。请下载 FFmpeg 并放置到以下目录：\n' +
      getFFmpegBaseDir() + '\n\n' +
      '下载地址：https://github.com/BtbN/FFmpeg-Builds/releases\n' +
      '请下载 ffmpeg-master-latest-win64-gpl.zip，解压后将 bin/ffmpeg.exe 和 bin/ffprobe.exe 放入上述目录。'
    )
  })()

  try {
    await downloadPromise
  } finally {
    downloadPromise = null
  }
}

export { getFFmpegBaseDir }
