import { useProjectStore } from '../../stores/useProjectStore'
import { useMediaStore } from '../../stores/useMediaStore'
import type { MediaAsset } from '../../types'
import { Film, Image, Music, GripVertical } from 'lucide-react'

interface MediaCardProps {
  asset: MediaAsset
}

export function MediaCard({ asset }: MediaCardProps): JSX.Element {
  const selectedAssetId = useMediaStore((s) => s.selectedAssetId)
  const selectAsset = useMediaStore((s) => s.selectAsset)
  const addClipToTrack = useProjectStore((s) => s.addClipToTrack)
  const project = useProjectStore((s) => s.project)

  const isSelected = selectedAssetId === asset.id
  const videoTrack = project.tracks.find(t => t.type === 'video')

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatDuration(seconds: number | null): string {
    if (seconds === null) return '--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleClick(): void {
    selectAsset(isSelected ? null : asset.id)
  }

  function handleDoubleClick(): void {
    if (!videoTrack) return
    addClipToTrack(videoTrack.id, {
      type: asset.type === 'audio' ? 'video' : asset.type as 'video' | 'image',
      sourceId: asset.id,
      startTime: 0,
      duration: asset.duration || 5,
      trimStart: 0,
      trimEnd: asset.duration || 5,
      volume: 1,
      speed: 1
    })
  }

  const TypeIcon = asset.type === 'video' ? Film : asset.type === 'image' ? Image : Music

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        background: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-text-muted)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
      title="单击选中 | 双击添加到时间轴"
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%',
        height: 72,
        background: 'var(--color-bg-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {asset.thumbnailPath && asset.type === 'image' ? (
          <img src={asset.thumbnailPath} alt={asset.fileName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <TypeIcon size={24} color="var(--color-text-muted)" />
        )}
        {/* Duration Badge */}
        {asset.duration !== null && (
          <span style={{
            position: 'absolute',
            bottom: 3,
            right: 3,
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            fontSize: 10,
            padding: '1px 4px',
            borderRadius: 3
          }}>
            {formatDuration(asset.duration)}
          </span>
        )}
        {/* Type Badge */}
        <span style={{
          position: 'absolute',
          top: 3,
          left: 3,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          fontSize: 9,
          padding: '1px 4px',
          borderRadius: 3,
          textTransform: 'uppercase'
        }}>
          {asset.type}
        </span>
      </div>

      {/* File Info */}
      <div style={{ padding: '6px 8px' }}>
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {asset.fileName}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          marginTop: 2
        }}>
          {asset.width > 0 && `${asset.width}×${asset.height}`}
          {asset.width > 0 && ' · '}
          {formatSize(asset.fileSize)}
        </div>
      </div>
    </div>
  )
}
