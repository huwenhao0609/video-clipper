import { spawn } from 'child_process'
import { getFFmpegPath } from './ffmpeg-manager'

export class FFmpegCommandBuilder {
  private ffmpegPath: string

  constructor() {
    this.ffmpegPath = getFFmpegPath() || 'ffmpeg'
  }

  async trim(inputPath: string, outputPath: string, start: number, duration: number): Promise<string> {
    const args = [
      '-ss', start.toString(),
      '-i', inputPath,
      '-t', duration.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputPath
    ]

    await this.run(args)
    return outputPath
  }

  async textOverlay(
    inputPath: string,
    outputPath: string,
    text: string,
    fontSize: number,
    fontColor: string,
    x: number,
    y: number
  ): Promise<string> {
    // Escape special characters in drawtext
    const escapedText = text.replace(/[\\:'"]/g, '\\$&')
    const drawtext = `text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}`

    const args = [
      '-i', inputPath,
      '-vf', `drawtext=${drawtext}`,
      '-c:a', 'copy',
      '-y',
      outputPath
    ]

    await this.run(args)
    return outputPath
  }

  async concat(inputPaths: string[], outputPath: string): Promise<string> {
    // Use concat demuxer
    const tmpDir = await import('./temp-files')
    const concatFilePath = tmpDir.createTempPath('.txt')

    // Write concat file
    const fs = await import('fs/promises')
    const content = inputPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    await fs.writeFile(concatFilePath, content)

    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c', 'copy',
      '-y',
      outputPath
    ]

    await this.run(args)
    return outputPath
  }

  async simpleExport(
    inputPath: string,
    outputPath: string,
    options: { width: number; height: number; fps: number; quality: number },
    onProgress?: (data: { percent: number; fps: number; eta: string }) => void
  ): Promise<string> {
    const args = [
      '-i', inputPath,
      '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
      '-r', options.fps.toString(),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', options.quality.toString(),
      '-c:a', 'aac',
      '-b:a', '192k',
      '-progress', 'pipe:1',
      '-y',
      outputPath
    ]

    await this.runWithProgress(args, onProgress)
    return outputPath
  }

  private run(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, args)
      let stderr = ''

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}\n${stderr.slice(-500)}`))
        }
      })

      proc.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`))
      })
    })
  }

  private runWithProgress(
    args: string[],
    onProgress?: (data: { percent: number; fps: number; eta: string }) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, args)
      let stderr = ''

      proc.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        if (onProgress) {
          // Parse progress info from FFmpeg output
          const percentMatch = output.match(/out_time_us=(\d+)/)
          const fpsMatch = output.match(/fps=(\d+\.?\d*)/)
          const speedMatch = output.match(/speed=(\d+\.?\d*)x/)

          if (percentMatch) {
            // Cannot calculate percent without total duration easily, skip for now
          }
          if (fpsMatch && onProgress) {
            onProgress({
              percent: 0,
              fps: parseFloat(fpsMatch[1]),
              eta: speedMatch ? `${speedMatch[1]}x` : 'calculating...'
            })
          }
        }
      })

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress({ percent: 100, fps: 0, eta: 'done' })
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}\n${stderr.slice(-500)}`))
        }
      })

      proc.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`))
      })
    })
  }
}
