// === Media ===
export interface MediaAsset {
  id: string
  filePath: string
  fileName: string
  type: 'video' | 'image' | 'audio'
  duration: number | null
  width: number
  height: number
  fileSize: number
  thumbnailPath: string
}

// === Timeline ===
export interface Clip {
  id: string
  type: 'video' | 'image' | 'text'
  sourceId: string
  trackId: string
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  // Text clip properties
  text?: string
  fontSize?: number
  fontColor?: string
  textX?: number
  textY?: number
  // Transitions
  transitionIn?: TransitionConfig
  transitionOut?: TransitionConfig
  // Audio
  volume: number
  speed: number
}

export interface TransitionConfig {
  type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'wipe'
  duration: number
}

export interface Track {
  id: string
  type: 'video' | 'text'
  label: string
  clips: Clip[]
  locked: boolean
  muted: boolean
}

export interface BGMTrack {
  sourceId: string
  volume: number
  fadeIn: number
  fadeOut: number
  startOffset: number
}

export interface WatermarkConfig {
  sourceId: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number
  scale: number
}

// === Project ===
export interface Project {
  id: string
  name: string
  config: {
    width: number
    height: number
    fps: number
  }
  tracks: Track[]
  bgm: BGMTrack | null
  watermark: WatermarkConfig | null
  templateId: string | null
  createdAt: string
  updatedAt: string
}

// === Template ===
export interface Template {
  id: string
  name: string
  description: string
  category: string
  version: string
  config: {
    width: number
    height: number
    fps: number
  }
  slots: TemplateSlot[]
  textOverlays: TemplateTextOverlay[]
}

export interface TemplateSlot {
  id: string
  label: string
  description: string
  acceptedTypes: ('video' | 'image')[]
  duration: number
  transitionIn?: { type: string; duration: number }
  transitionOut?: { type: string; duration: number }
}

export interface TemplateTextOverlay {
  id: string
  text: string
  placeholder: string
  x: number
  y: number
  fontSize: number
  fontColor: string
}

// === Export ===
export interface ExportOptions {
  projectId: string
  outputPath: string
  width: number
  height: number
  fps: number
  quality: number
}

// === FFmpeg ===
export interface FFmpegProgress {
  percent: number
  fps: number
  eta: string
}

// === Window API ===
export interface ElectronAPI {
  media: {
    import: () => Promise<MediaAsset[]>
    getInfo: (filePath: string) => Promise<MediaAsset>
    generateThumbnail: (filePath: string) => Promise<string>
    deleteTempFiles: (paths: string[]) => Promise<void>
  }
  ffmpeg: {
    checkReady: () => Promise<{ ready: boolean; status: string }>
    download: () => Promise<void>
    trim: (params: { inputPath: string; outputPath: string; start: number; duration: number }) => Promise<string>
    textOverlay: (params: { inputPath: string; outputPath: string; text: string; fontSize: number; fontColor: string; x: number; y: number }) => Promise<string>
    concat: (inputPaths: string[], outputPath: string) => Promise<string>
    export: (config: ExportOptions) => Promise<string>
    onProgress: (callback: (progress: FFmpegProgress) => void) => () => void
  }
  templates: {
    list: () => Promise<Template[]>
    load: (id: string) => Promise<Template>
  }
  project: {
    save: (data: unknown) => Promise<string>
    load: () => Promise<unknown>
    export: (data: unknown, options: ExportOptions) => Promise<string>
  }
  app: {
    getVersion: () => Promise<string>
    getFFmpegStatus: () => Promise<{ ready: boolean; status: string }>
    onMenuAction: (callback: (action: string) => void) => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
