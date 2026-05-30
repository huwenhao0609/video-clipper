import { useCallback, useRef } from 'react'
import { useMediaStore } from '../../stores/useMediaStore'
import { useAppStore } from '../../stores/useAppStore'
import { MediaCard } from './MediaCard'
import { Upload, Loader2 } from 'lucide-react'

export function MediaLibrary(): JSX.Element {
  const assets = useMediaStore((s) => s.assets)
  const importing = useMediaStore((s) => s.importing)
  const addAssets = useMediaStore((s) => s.addAssets)
  const setImporting = useMediaStore((s) => s.setImporting)
  const setFfmpegStatus = useAppStore((s) => s.setFfmpegStatus)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(async () => {
    if (!window.electronAPI) {
      // Fallback for browser dev: use file input
      fileInputRef.current?.click()
      return
    }

    setImporting(true)
    try {
      const newAssets = await window.electronAPI.media.import()
      if (newAssets.length > 0) {
        addAssets(newAssets)
      }
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
    }
  }, [addAssets, setImporting])

  // Fallback file input handler for development without Electron
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setImporting(true)
    const newAssets: typeof assets = []
    const fileArray = Array.from(files)

    Promise.all(
      fileArray.map(async (file) => {
        const url = URL.createObjectURL(file)
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv']
        const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif']
        const audioExts = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a']

        let type: 'video' | 'image' | 'audio' = 'video'
        if (imageExts.includes(ext)) type = 'image'
        else if (audioExts.includes(ext)) type = 'audio'

        // Try to get video dimensions
        let width = 0
        let height = 0
        let duration: number | null = null

        if (type === 'video' || type === 'image') {
          try {
            const dims = await getMediaDimensions(url, type)
            width = dims.width
            height = dims.height
            duration = dims.duration
          } catch {
            // ignore
          }
        }

        newAssets.push({
          id: crypto.randomUUID(),
          filePath: url, // blob URL for dev
          fileName: file.name,
          type,
          duration,
          width,
          height,
          fileSize: file.size,
          thumbnailPath: type === 'image' ? url : ''
        })
      })
    ).then(() => {
      addAssets(newAssets)
      setImporting(false)
    })
  }, [addAssets, setImporting])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Import Button Area */}
      <div style={{ padding: 12 }}>
        <button
          onClick={handleImport}
          disabled={importing}
          style={{
            width: '100%',
            background: importing ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
            color: importing ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            border: '2px dashed var(--color-border)',
            borderRadius: 8,
            padding: '24px 16px',
            cursor: importing ? 'default' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!importing) {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.color = 'var(--color-accent)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
        >
          {importing ? (
            <>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              导入中...
            </>
          ) : (
            <>
              <Upload size={24} />
              点击导入或拖拽文件
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                支持视频 / 图片 / 音频
              </span>
            </>
          )}
        </button>
        {/* Hidden file input for browser dev fallback */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Media Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 12px 12px'
      }}>
        {assets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 32,
            color: 'var(--color-text-muted)',
            fontSize: 13
          }}>
            暂无媒体文件
            <br />
            <span style={{ fontSize: 11 }}>导入视频或图片开始编辑</span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8
          }}>
            {assets.map((asset) => (
              <MediaCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper: get media dimensions using browser APIs (dev fallback)
async function getMediaDimensions(
  url: string,
  type: 'video' | 'image' | 'audio'
): Promise<{ width: number; height: number; duration: number | null }> {
  return new Promise((resolve) => {
    if (type === 'image') {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, duration: null })
      img.onerror = () => resolve({ width: 0, height: 0, duration: null })
      img.src = url
    } else if (type === 'video') {
      const video = document.createElement('video')
      video.onloadedmetadata = () => resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      })
      video.onerror = () => resolve({ width: 0, height: 0, duration: null })
      video.src = url
    } else {
      resolve({ width: 0, height: 0, duration: null })
    }
  })
}
