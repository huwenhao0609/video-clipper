import { ipcMain, dialog, BrowserWindow } from 'electron'
import { getMediaInfo } from '../services/media-info'
import { generateThumbnail } from '../services/thumbnail'
import { v4 as uuidv4 } from 'uuid'
import type { MediaAsset } from '../../preload/types'

export function registerMediaHandlers(): void {
  ipcMain.handle('media:import', async (): Promise<MediaAsset[]> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return []

    const result = await dialog.showOpenDialog(window, {
      title: '导入媒体文件',
      filters: [
        {
          name: '媒体文件',
          extensions: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'aac']
        },
        { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'webm', 'mkv'] },
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
        { name: '音频文件', extensions: ['mp3', 'wav', 'aac'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) return []

    const assets: MediaAsset[] = []
    for (const filePath of result.filePaths) {
      try {
        const info = await getMediaInfo(filePath)
        const thumbnailPath = await generateThumbnail(filePath)
        assets.push({
          id: uuidv4(),
          ...info,
          thumbnailPath
        })
      } catch (err) {
        console.error(`Failed to import ${filePath}:`, err)
      }
    }

    return assets
  })

  ipcMain.handle('media:getInfo', async (_event, filePath: string): Promise<MediaAsset> => {
    const info = await getMediaInfo(filePath)
    const thumbnailPath = await generateThumbnail(filePath)
    return {
      id: uuidv4(),
      ...info,
      thumbnailPath
    }
  })

  ipcMain.handle('media:generateThumbnail', async (_event, filePath: string): Promise<string> => {
    return generateThumbnail(filePath)
  })

  ipcMain.handle('media:deleteTempFiles', async (_event, paths: string[]): Promise<void> => {
    const fs = await import('fs/promises')
    for (const p of paths) {
      try {
        await fs.unlink(p)
      } catch {
        // ignore
      }
    }
  })
}
