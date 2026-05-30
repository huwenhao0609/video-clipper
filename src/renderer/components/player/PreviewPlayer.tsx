import { useRef, useEffect, useCallback } from 'react'
import { useTimelineStore } from '../../stores/useTimelineStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useMediaStore } from '../../stores/useMediaStore'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

export function PreviewPlayer(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const seek = useTimelineStore((s) => s.seek)
  const play = useTimelineStore((s) => s.play)
  const pause = useTimelineStore((s) => s.pause)
  const togglePlay = useTimelineStore((s) => s.togglePlay)
  const selectedClipId = useTimelineStore((s) => s.selectedClipId)
  const project = useProjectStore((s) => s.project)
  const assets = useMediaStore((s) => s.assets)

  // Find the currently previewable clip
  const selectedClip = project.tracks
    .flatMap(t => t.clips)
    .find(c => c.id === selectedClipId)

  const sourceAsset = selectedClip
    ? assets.find(a => a.id === selectedClip.sourceId)
    : null

  const previewSrc = sourceAsset?.filePath || ''

  // Sync video element with timeline
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !selectedClip) return

    // Adjust currentTime based on clip trim
    const clipTime = currentTime - selectedClip.startTime + selectedClip.trimStart
    if (Math.abs(video.currentTime - clipTime) > 0.3) {
      video.currentTime = clipTime
    }
  }, [currentTime, selectedClip])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !selectedClip) return

    const newTime = video.currentTime - selectedClip.trimStart + selectedClip.startTime
    seek(newTime)
  }, [selectedClip, seek])

  const handleEnded = useCallback(() => {
    pause()
  }, [pause])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      background: '#000',
      position: 'relative',
      flexShrink: 0,
      height: 360,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {previewSrc ? (
        <video
          ref={videoRef}
          src={previewSrc}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      ) : (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
          <Play size={48} opacity={0.3} />
          <p style={{ marginTop: 12, fontSize: 14 }}>导入媒体并添加到时间轴以预览</p>
        </div>
      )}

      {/* Player Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        padding: '16px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <button onClick={() => seek(Math.max(0, currentTime - 5))}
          style={controlBtnStyle} title="后退5秒">
          <SkipBack size={16} />
        </button>

        <button onClick={togglePlay}
          style={{
            ...controlBtnStyle,
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%'
          }}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button onClick={() => seek(currentTime + 5)}
          style={controlBtnStyle} title="前进5秒">
          <SkipForward size={16} />
        </button>

        <span style={{ color: '#fff', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)}
        </span>

        <div style={{ flex: 1 }} />

        <Volume2 size={14} color="rgba(255,255,255,0.6)" />
      </div>
    </div>
  )
}

const controlBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  borderRadius: 4
}
