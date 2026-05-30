import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let loadingPromise: Promise<void> | null = null

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg

  if (loadingPromise) {
    await loadingPromise
    return ffmpeg!
  }

  ffmpeg = new FFmpeg()

  loadingPromise = (async () => {
    try {
      // Load WASM core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg!.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      console.log('[FFmpeg WASM] Loaded successfully')
    } catch (err) {
      console.error('[FFmpeg WASM] Failed to load:', err)
      ffmpeg = null
      loadingPromise = null
      throw new Error('FFmpeg 加载失败，请检查网络连接')
    }
  })()

  await loadingPromise
  return ffmpeg!
}

export async function processVideo(
  inputFile: File,
  options: {
    productName?: string
    productPrice?: string
    outputWidth?: number
    outputHeight?: number
    onProgress?: (percent: number) => void
  }
): Promise<Blob> {
  const ff = await getFFmpeg()
  const { productName, productPrice, outputWidth = 1080, outputHeight = 1080 } = options

  // Write input file to FFmpeg virtual FS
  const inputName = 'input' + getExtension(inputFile.name)
  await ff.writeFile(inputName, await fetchFile(inputFile))

  // Build filter chain
  const filters: string[] = []

  // Scale and pad to target size
  filters.push(
    `scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=decrease`,
    `pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2:black`
  )

  // Text overlays
  const textOverlays: string[] = []
  if (productName) {
    const escapedName = productName.replace(/'/g, "\\'").replace(/:/g, '\\:')
    textOverlays.push(
      `drawtext=text='${escapedName}':fontsize=48:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2:x=(w-text_w)/2:y=60`
    )
  }
  if (productPrice) {
    const escapedPrice = productPrice.replace(/'/g, "\\'").replace(/:/g, '\\:')
    textOverlays.push(
      `drawtext=text='${escapedPrice}':fontsize=40:fontcolor=#FFD700:shadowcolor=black:shadowx=2:shadowy=2:x=(w-text_w)/2:y=h-text_h-80`
    )
  }

  if (textOverlays.length > 0) {
    filters.push(textOverlays.join(','))
  }

  const vf = filters.join(',')

  const outputName = 'output.mp4'

  // Build FFmpeg command
  const args = [
    '-i', inputName,
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputName
  ]

  // Set up progress handler
  ff.on('progress', ({ progress }) => {
    options.onProgress?.(Math.round(progress * 100))
  })

  // Execute
  await ff.exec(args)

  // Read output
  const data = await ff.readFile(outputName)
  const blob = new Blob([data], { type: 'video/mp4' })

  // Cleanup
  await ff.deleteFile(inputName)
  await ff.deleteFile(outputName)

  return blob
}

export async function trimVideo(
  inputFile: File,
  start: number,
  duration: number,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg()
  const inputName = 'input' + getExtension(inputFile.name)

  await ff.writeFile(inputName, await fetchFile(inputFile))

  const outputName = 'trimmed.mp4'
  ff.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  await ff.exec([
    '-ss', start.toString(),
    '-i', inputName,
    '-t', duration.toString(),
    '-c', 'copy',
    '-y',
    outputName
  ])

  const data = await ff.readFile(outputName)
  return new Blob([data], { type: 'video/mp4' })
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'mp4'
  return '.' + ext
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
