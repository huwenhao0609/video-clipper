import { extname } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']

export async function generateThumbnail(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()

  // For images, return the file path directly as thumbnail
  if (imageExts.includes(ext)) {
    return filePath
  }

  // For video/audio, generate thumbnail via ffprobe/ffmpeg when available
  // For now, return a placeholder
  const thumbDir = join(app.getPath('userData'), 'thumbnails')
  if (!existsSync(thumbDir)) {
    mkdirSync(thumbDir, { recursive: true })
  }

  // For videos, try to generate thumbnail using ffmpeg
  try {
    const { getFFmpegPath } = await import('./ffmpeg-manager')
    const ffmpegPath = getFFmpegPath()
    if (ffmpegPath) {
      const thumbPath = join(thumbDir, `${Buffer.from(filePath).toString('base64')}.png`)
      if (existsSync(thumbPath)) return thumbPath

      const { spawn } = await import('child_process')
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegPath, [
          '-ss', '1',
          '-i', filePath,
          '-vframes', '1',
          '-q:v', '2',
          '-y',
          thumbPath
        ])
        proc.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`ffmpeg exited with code ${code}`))
        })
        proc.on('error', reject)
      })
      return thumbPath
    }
  } catch {
    // FFmpeg not available yet, return placeholder
  }

  return filePath // fallback
}
