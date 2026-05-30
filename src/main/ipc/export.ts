import { ipcMain, dialog, BrowserWindow } from 'electron'
import type { ExportOptions } from '../../preload/types'

export function registerExportHandlers(): void {
  ipcMain.handle('project:save', async (_event, data: unknown): Promise<string> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) throw new Error('No focused window')

    const result = await dialog.showSaveDialog(window, {
      title: '保存项目',
      filters: [
        { name: 'Video Clipper Project', extensions: ['vcp'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      defaultPath: 'project.vcp'
    })

    if (result.canceled || !result.filePath) {
      throw new Error('Save cancelled')
    }

    const fs = await import('fs/promises')
    await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return result.filePath
  })

  ipcMain.handle('project:load', async (): Promise<unknown> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) throw new Error('No focused window')

    const result = await dialog.showOpenDialog(window, {
      title: '打开项目',
      filters: [
        { name: 'Video Clipper Project', extensions: ['vcp'] },
        { name: 'JSON', extensions: ['json'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      throw new Error('Open cancelled')
    }

    const fs = await import('fs/promises')
    const content = await fs.readFile(result.filePaths[0], 'utf-8')
    return JSON.parse(content)
  })

  ipcMain.handle('project:export', async (_event, projectData: unknown, options: ExportOptions): Promise<string> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) throw new Error('No focused window')

    const result = await dialog.showSaveDialog(window, {
      title: '导出视频',
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'output.mp4'
    })

    if (result.canceled || !result.filePath) {
      throw new Error('Export cancelled')
    }

    // The actual export is handled via ffmpeg:export IPC
    // This just manages the file dialog
    return result.filePath
  })
}
