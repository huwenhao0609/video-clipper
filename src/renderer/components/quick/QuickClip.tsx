import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useMediaStore } from '../../stores/useMediaStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { Upload, Play, Pause, Sparkles, Wand2, Film, ChevronRight } from 'lucide-react'
import type { MediaAsset } from '../../types'

type Step = 'select' | 'edit' | 'done'

const QUICK_STYLES = [
  { id: 'fast', label: '快速展示', desc: '直接导出，保留原视频', process: false },
  { id: 'text-top', label: '标题置顶', desc: '顶部加产品名 + 价格', process: true },
  { id: 'text-bottom', label: '底部标签', desc: '底部加品牌水印文字', process: true },
]

export function QuickClip(): JSX.Element {
  const [step, setStep] = useState<Step>('select')
  const [videoFile, setVideoFile] = useState<MediaAsset | null>(null)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('text-top')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addAssets = useMediaStore((s) => s.addAssets)
  const switchToAdvanced = useAppStore((s) => s.setActivePanel)

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv']
    const imageExts = ['jpg', 'jpeg', 'png', 'webp']

    let type: 'video' | 'image' = 'video'
    if (imageExts.includes(ext)) type = 'image'
    if (!videoExts.includes(ext) && !imageExts.includes(ext)) {
      alert('请选择视频或图片文件（MP4/MOV/JPG/PNG等）')
      return
    }

    // Get dimensions
    let width = 0, height = 0, duration: number | null = null
    try {
      if (type === 'video') {
        const dims = await getVideoDimensions(url)
        width = dims.width; height = dims.height; duration = dims.duration
      } else {
        const dims = await getImageDimensions(url)
        width = dims.width; height = dims.height
      }
    } catch { /* ignore */ }

    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      filePath: url,
      fileName: file.name,
      type,
      duration,
      width,
      height,
      fileSize: file.size,
      thumbnailPath: type === 'image' ? url : ''
    }

    setVideoFile(asset)
    addAssets([asset])
    setStep('edit')
    setIsPlaying(false)
    setExportDone(false)
  }, [addAssets])

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) { video.pause(); setIsPlaying(false) }
    else { video.play(); setIsPlaying(true) }
  }

  // Export
  const handleExport = async () => {
    if (!videoFile) return
    setIsExporting(true)

    try {
      if (window.electronAPI) {
        // In Electron: use FFmpeg via IPC
        const outputPath = await window.electronAPI.project.export(
          { filePath: videoFile.filePath, productName, productPrice, style: selectedStyle },
          { projectId: videoFile.id, outputPath: '', width: 1080, height: 1080, fps: 30, quality: 23 }
        )

        if (selectedStyle !== 'fast' && (productName || productPrice)) {
          const textOverlay = [
            productName && `text='${productName}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=80`,
            productPrice && `text='${productPrice}':fontsize=40:fontcolor=#FFD700:x=(w-text_w)/2:y=h-120`
          ].filter(Boolean).join(',')

          if (textOverlay) {
            await window.electronAPI.ffmpeg.textOverlay({
              inputPath: videoFile.filePath,
              outputPath,
              text: [productName, productPrice].filter(Boolean).join(' | '),
              fontSize: 52,
              fontColor: '#FFFFFF',
              x: -1, // center
              y: 80
            })
          }
        }

        await window.electronAPI.ffmpeg.export({
          projectId: videoFile.id,
          outputPath,
          width: 1080,
          height: 1080,
          fps: 30,
          quality: 23
        })
      } else {
        // Fallback: just show success in browser dev mode
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      setExportDone(true)
      setStep('done')
    } catch (err: any) {
      console.error('Export failed:', err)
      alert('导出失败: ' + (err.message || '未知错误'))
    } finally {
      setIsExporting(false)
    }
  }

  // Format helpers
  const formatDuration = (d: number | null) => {
    if (!d) return ''
    const m = Math.floor(d / 60)
    const s = Math.floor(d % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      overflow: 'auto',
      background: 'var(--color-bg-dark)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <Wand2 size={28} color="var(--color-accent)" />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>一键快剪</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
          拖入视频，输入产品信息，一键生成
        </p>
      </div>

      {/* Step indicator */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 28,
        fontSize: 12,
        color: 'var(--color-text-muted)',
        alignItems: 'center'
      }}>
        {[
          { s: 'select', label: '选择视频' },
          { s: 'edit', label: '编辑信息' },
          { s: 'done', label: '导出完成' },
        ].map((item, i) => (
          <div key={item.s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: step === item.s ? 'var(--color-accent)' : 'var(--color-bg-surface)',
              color: step === item.s ? '#fff' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              border: step === item.s ? 'none' : '1px solid var(--color-border)'
            }}>
              {step === 'done' && (i < 2 ? '✓' : i + 1)}
              {step !== 'done' && (i < ['select','edit','done'].indexOf(step) ? '✓' : i + 1)}
            </div>
            <span style={{ color: step === item.s ? 'var(--color-text-primary)' : undefined }}>
              {item.label}
            </span>
            {i < 2 && <ChevronRight size={12} />}
          </div>
        ))}
      </div>

      {/* Step: Select Video */}
      {step === 'select' && (
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', maxWidth: 520,
            height: 260,
            border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 16,
            background: dragOver ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Upload size={48} color={dragOver ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            拖拽视频到此处
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            或点击选择文件 · 支持 MP4 / MOV / JPG / PNG
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Step: Edit */}
      {step === 'edit' && videoFile && (
        <div style={{ width: '100%', maxWidth: 700 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Video Preview */}
            <div style={{
              flex: '0 0 320px',
              background: '#000',
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '1 / 1'
            }}>
              <video
                ref={videoRef}
                src={videoFile.filePath}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onEnded={() => setIsPlaying(false)}
              />
              {/* Text overlays preview */}
              {selectedStyle === 'text-top' && productName && (
                <div style={{
                  position: 'absolute', top: 24, left: 0, right: 0, textAlign: 'center',
                  color: '#fff', fontSize: 22, fontWeight: 700,
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}>
                  {productName}
                  {productPrice && <div style={{ fontSize: 18, color: '#FFD700', marginTop: 4 }}>{productPrice}</div>}
                </div>
              )}
              {selectedStyle === 'text-bottom' && (productName || productPrice) && (
                <div style={{
                  position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center',
                  color: '#fff', fontSize: 18, fontWeight: 600,
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}>
                  {[productName, productPrice].filter(Boolean).join(' · ')}
                </div>
              )}
              {/* Play button overlay */}
              <div
                onClick={togglePlay}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                {!isPlaying && (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Play size={28} fill="#fff" color="#fff" />
                  </div>
                )}
              </div>
              {/* File info */}
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                background: 'rgba(0,0,0,0.7)', color: '#fff',
                fontSize: 10, padding: '2px 6px', borderRadius: 4
              }}>
                {formatDuration(videoFile.duration)} · {formatSize(videoFile.fileSize)}
              </div>
            </div>

            {/* Edit Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                产品信息
              </div>

              {/* Product Name */}
              <div>
                <label style={labelStyle}>产品名称</label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="例如：18K金镶钻项链"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Price */}
              <div>
                <label style={labelStyle}>价格</label>
                <input
                  type="text"
                  value={productPrice}
                  onChange={e => setProductPrice(e.target.value)}
                  placeholder="例如：¥299"
                  style={inputStyle}
                />
              </div>

              {/* Style Selection */}
              <div>
                <label style={labelStyle}>展示风格</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {QUICK_STYLES.map(style => (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: selectedStyle === style.id
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        background: selectedStyle === style.id
                          ? 'var(--color-bg-hover)'
                          : 'var(--color-bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{style.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {style.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '14px 20px',
                  background: isExporting ? 'var(--color-bg-hover)' : 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isExporting ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s'
                }}
              >
                <Sparkles size={20} />
                {isExporting ? '正在生成视频...' : '一键生成视频'}
              </button>

              {/* Switch to advanced */}
              <button
                onClick={() => switchToAdvanced('properties')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 8
                }}
              >
                <Film size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                需要更多编辑功能？切换到高级模式
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div style={{
          textAlign: 'center',
          padding: 48,
          background: 'var(--color-bg-surface)',
          borderRadius: 16,
          maxWidth: 420
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: 32 }}>✓</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>视频已生成！</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            导出文件已保存到指定位置
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => { setStep('select'); setVideoFile(null); setProductName(''); setProductPrice(''); setExportDone(false) }}
              style={{
                padding: '10px 20px',
                background: 'var(--color-bg-hover)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              再剪一条
            </button>
            <button
              onClick={() => switchToAdvanced('properties')}
              style={{
                padding: '10px 20px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              高级编辑
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers
function getVideoDimensions(url: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => resolve({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration
    })
    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = url
  })
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 4
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box'
}
