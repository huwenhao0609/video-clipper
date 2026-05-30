import { ipcMain, BrowserWindow } from 'electron'
import { ensureFFmpeg, downloadFFmpeg } from '../services/ffmpeg-manager'
import { FFmpegCommandBuilder } from '../services/ffmpeg-commands'
import { createTempPath, cleanupTempFiles } from '../services/temp-files'
import type { TrimParams, TextOverlayParams, ExportOptions } from '../../preload/types'

export function registerFfmpegHandlers(): void {
  // Clean up old temp files on startup
  cleanupTempFiles()

  ipcMain.handle('ffmpeg:check', async () => {
    return ensureFFmpeg()
  })

  ipcMain.handle('ffmpeg:download', async () => {
    const window = BrowserWindow.getFocusedWindow()
    await downloadFFmpeg((percent, eta) => {
      window?.webContents.send('ffmpeg:download-progress', { percent, eta })
    })
  })

  ipcMain.handle('ffmpeg:trim', async (_event, params: TrimParams): Promise<string> => {
    const builder = new FFmpegCommandBuilder()
    const outputPath = params.outputPath || createTempPath('.mp4')
    await builder.trim(params.inputPath, outputPath, params.start, params.duration)
    return outputPath
  })

  ipcMain.handle('ffmpeg:textOverlay', async (_event, params: TextOverlayParams): Promise<string> => {
    const builder = new FFmpegCommandBuilder()
    const outputPath = params.outputPath || createTempPath('.mp4')
    await builder.textOverlay(
      params.inputPath, outputPath,
      params.text, params.fontSize, params.fontColor, params.x, params.y
    )
    return outputPath
  })

  ipcMain.handle('ffmpeg:concat', async (_event, inputPaths: string[], outputPath?: string): Promise<string> => {
    const builder = new FFmpegCommandBuilder()
    const outPath = outputPath || createTempPath('.mp4')
    await builder.concat(inputPaths, outPath)
    return outPath
  })

  ipcMain.handle('ffmpeg:export', async (event, options: ExportOptions): Promise<string> => {
    const builder = new FFmpegCommandBuilder()
    const window = BrowserWindow.fromWebContents(event.sender)

    // For now, simple export from media library
    // Full timeline composite export comes in Phase 2
    const outputPath = options.outputPath || createTempPath('.mp4')

    // TODO: Phase 2 — replace with full composer pipeline
    await builder.simpleExport(
      options.projectId, // temporarily use as input path
      outputPath,
      {
        width: options.width,
        height: options.height,
        fps: options.fps,
        quality: options.quality
      },
      (progress) => {
        window?.webContents.send('ffmpeg:progress', {
          percent: progress.percent,
          fps: progress.fps,
          eta: progress.eta
        })
      }
    )

    return outputPath
  })
}
