import { ipcMain } from 'electron'
import { registerMediaHandlers } from './media'
import { registerFfmpegHandlers } from './ffmpeg'
import { registerExportHandlers } from './export'
import { registerTemplateHandlers } from './templates'

export function registerIpcHandlers(): void {
  registerMediaHandlers()
  registerFfmpegHandlers()
  registerExportHandlers()
  registerTemplateHandlers()

  // App info handler
  ipcMain.handle('app:version', () => '1.0.0')
}
