// Shared IPC contract types

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

export interface TrimParams {
  inputPath: string
  outputPath: string
  start: number
  duration: number
}

export interface TextOverlayParams {
  inputPath: string
  outputPath: string
  text: string
  fontSize: number
  fontColor: string
  x: number
  y: number
}

export interface ExportOptions {
  projectId: string
  outputPath: string
  width: number
  height: number
  fps: number
  quality: number // 1-51 CRF (lower = better)
}

export interface ExportProgress {
  percent: number
  fps: number
  time: string
  eta: string
}

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
