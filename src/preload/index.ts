import { contextBridge, ipcRenderer } from 'electron'

const api = {
  media: {
    import: (): Promise<any[]> => ipcRenderer.invoke('media:import'),
    getInfo: (filePath: string): Promise<any> => ipcRenderer.invoke('media:getInfo', filePath),
    generateThumbnail: (filePath: string): Promise<string> => ipcRenderer.invoke('media:generateThumbnail', filePath),
    deleteTempFiles: (paths: string[]): Promise<void> => ipcRenderer.invoke('media:deleteTempFiles', paths),
  },

  ffmpeg: {
    checkReady: (): Promise<{ ready: boolean; status: string }> => ipcRenderer.invoke('ffmpeg:check'),
    download: (): Promise<void> => ipcRenderer.invoke('ffmpeg:download'),
    trim: (params: any): Promise<string> => ipcRenderer.invoke('ffmpeg:trim', params),
    textOverlay: (params: any): Promise<string> => ipcRenderer.invoke('ffmpeg:textOverlay', params),
    concat: (inputPaths: string[], outputPath: string): Promise<string> =>
      ipcRenderer.invoke('ffmpeg:concat', inputPaths, outputPath),
    export: (config: any): Promise<string> => ipcRenderer.invoke('ffmpeg:export', config),
    onProgress: (callback: (progress: { percent: number; fps: number; eta: string }) => void) => {
      const handler = (_event: any, progress: { percent: number; fps: number; eta: string }) => callback(progress)
      ipcRenderer.on('ffmpeg:progress', handler)
      return () => { ipcRenderer.removeListener('ffmpeg:progress', handler) }
    },
  },

  templates: {
    list: (): Promise<any[]> => ipcRenderer.invoke('templates:list'),
    load: (id: string): Promise<any> => ipcRenderer.invoke('templates:load', id),
  },

  project: {
    save: (data: unknown): Promise<string> => ipcRenderer.invoke('project:save', data),
    load: (): Promise<unknown> => ipcRenderer.invoke('project:load'),
    export: (data: unknown, options: any): Promise<string> => ipcRenderer.invoke('project:export', data, options),
  },

  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
    getFFmpegStatus: (): Promise<{ ready: boolean; status: string }> => ipcRenderer.invoke('ffmpeg:check'),
    onMenuAction: (callback: (action: string) => void) => {
      const actions = [
        'menu:new-project', 'menu:open-project', 'menu:save-project',
        'menu:export', 'menu:undo', 'menu:redo'
      ]
      const cleanups: (() => void)[] = []
      for (const action of actions) {
        const handler = () => callback(action)
        ipcRenderer.on(action, handler)
        cleanups.push(() => { ipcRenderer.removeListener(action, handler) })
      }
      return () => { cleanups.forEach(fn => fn()) }
    },
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
