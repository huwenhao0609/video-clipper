import { extname } from 'path'
import { statSync } from 'fs'

// Lightweight media info without ffprobe dependency initially
// Full ffprobe integration added when FFmpeg is downloaded
export async function getMediaInfo(filePath: string): Promise<{
  filePath: string
  fileName: string
  type: 'video' | 'image' | 'audio'
  duration: number | null
  width: number
  height: number
  fileSize: number
}> {
  const ext = extname(filePath).toLowerCase()
  const stats = statSync(filePath)

  const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv']
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']
  const audioExts = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']

  let type: 'video' | 'image' | 'audio' = 'video'
  if (imageExts.includes(ext)) type = 'image'
  else if (audioExts.includes(ext)) type = 'audio'

  const fileName = filePath.split(/[/\\]/).pop() || 'unknown'

  // Default dimensions — will be updated by ffprobe when available
  return {
    filePath,
    fileName,
    type,
    duration: null, // populated by ffprobe later
    width: 0,
    height: 0,
    fileSize: stats.size
  }
}
