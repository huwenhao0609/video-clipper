import { useRef, useCallback, useEffect, useState } from 'react'
import { useTimelineStore } from '../../stores/useTimelineStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useMediaStore } from '../../stores/useMediaStore'
import { ZoomIn, ZoomOut, Plus, Lock, Unlock, Volume2, VolumeX } from 'lucide-react'

export function Timeline(): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const zoom = useTimelineStore((s) => s.zoom)
  const scrollLeft = useTimelineStore((s) => s.scrollLeft)
  const setZoom = useTimelineStore((s) => s.setZoom)
  const setScrollLeft = useTimelineStore((s) => s.setScrollLeft)
  const seek = useTimelineStore((s) => s.seek)
  const totalDuration = useTimelineStore((s) => s.totalDuration)
  const selectedClipId = useTimelineStore((s) => s.selectedClipId)
  const selectClip = useTimelineStore((s) => s.selectClip)
  const project = useProjectStore((s) => s.project)
  const addTrack = useProjectStore((s) => s.addTrack)
  const moveClip = useProjectStore((s) => s.moveClip)
  const assets = useMediaStore((s) => s.assets)
  const [draggingClip, setDraggingClip] = useState<string | null>(null)

  const timelineWidth = totalDuration * zoom
  const pixelsPerSecond = zoom

  // Ruler marks
  const rulerMarks: { time: number; x: number }[] = []
  const markInterval = zoom > 100 ? 0.5 : zoom > 50 ? 1 : zoom > 25 ? 2 : 5
  for (let t = 0; t <= totalDuration; t += markInterval) {
    rulerMarks.push({ time: t, x: t * pixelsPerSecond })
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    if (seconds < 60) return `${s}s`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleRulerClick(e: React.MouseEvent): void {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollLeft
    const time = Math.max(0, x / pixelsPerSecond)
    seek(time)
  }

  function handleClipDragStart(clipId: string): void {
    setDraggingClip(clipId)
  }

  function handleClipDrag(e: React.MouseEvent, clipId: string): void {
    if (draggingClip !== clipId) return
    const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left + scrollLeft
    const newStart = Math.max(0, Math.round(x / pixelsPerSecond))
    moveClip(clipId, newStart)
  }

  function handleClipDragEnd(): void {
    setDraggingClip(null)
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const newZoom = zoom - e.deltaY * 0.1
      setZoom(newZoom)
    }
  }, [zoom, setZoom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  return (
    <div style={{
      background: 'var(--color-bg-panel)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden'
    }}>
      {/* Timeline Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderBottom: '1px solid var(--color-border)',
        gap: 8,
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        flexShrink: 0
      }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-text-primary)' }}>时间轴</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setZoom(zoom - 10)} style={smallBtnStyle} title="缩小">
          <ZoomOut size={14} />
        </button>
        <span style={{ minWidth: 50, textAlign: 'center' }}>{Math.round(zoom)}px/s</span>
        <button onClick={() => setZoom(zoom + 10)} style={smallBtnStyle} title="放大">
          <ZoomIn size={14} />
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 4px' }} />
        <button onClick={addTrack} style={smallBtnStyle} title="添加轨道">
          <Plus size={14} />
        </button>
      </div>

      {/* Timeline Content */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative'
        }}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        <div style={{
          width: Math.max(timelineWidth, 1200),
          minHeight: '100%',
          position: 'relative'
        }}>
          {/* Ruler */}
          <div
            onClick={handleRulerClick}
            style={{
              height: 28,
              borderBottom: '1px solid var(--color-border)',
              position: 'sticky',
              top: 0,
              background: 'var(--color-bg-panel)',
              zIndex: 3,
              cursor: 'pointer'
            }}
          >
            {rulerMarks.map((mark) => (
              <div key={mark.time} style={{
                position: 'absolute',
                left: mark.x,
                top: 0,
                height: '100%',
                borderLeft: '1px solid var(--color-border)'
              }}>
                <span style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap'
                }}>
                  {formatTime(mark.time)}
                </span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div style={{
            position: 'absolute',
            left: currentTime * pixelsPerSecond,
            top: 28,
            bottom: 0,
            width: 2,
            background: 'var(--color-danger)',
            zIndex: 4,
            pointerEvents: 'none'
          }}>
            {/* Playhead triangle */}
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid var(--color-danger)',
              marginLeft: -5,
              marginTop: -2
            }} />
          </div>

          {/* Tracks */}
          {project.tracks.map((track, trackIndex) => (
            <div
              key={track.id}
              style={{
                height: 52,
                borderBottom: '1px solid var(--color-border)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* Track Label */}
              <div style={{
                width: 120,
                minWidth: 120,
                padding: '0 8px',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                position: 'sticky',
                left: 0,
                background: 'var(--color-bg-panel)',
                zIndex: 2,
                height: '100%',
                borderRight: '1px solid var(--color-border)'
              }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.label}
                </span>
              </div>

              {/* Track Content Area */}
              <div style={{
                flex: 1,
                height: '100%',
                position: 'relative'
              }}>
                {track.clips.map((clip) => {
                  const asset = assets.find(a => a.id === clip.sourceId)
                  const isSelected = selectedClipId === clip.id
                  const clipWidth = clip.duration * pixelsPerSecond
                  const clipLeft = clip.startTime * pixelsPerSecond

                  return (
                    <div
                      key={clip.id}
                      onClick={() => selectClip(clip.id)}
                      onMouseDown={() => handleClipDragStart(clip.id)}
                      onMouseUp={handleClipDragEnd}
                      style={{
                        position: 'absolute',
                        left: clipLeft,
                        top: 4,
                        height: 'calc(100% - 8px)',
                        width: Math.max(clipWidth, 20),
                        background: isSelected ? 'var(--color-accent)' : 'var(--color-bg-hover)',
                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        fontSize: 10,
                        color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        userSelect: 'none',
                        transition: 'background 0.1s, border-color 0.1s'
                      }}
                    >
                      {/* Clip thumbnail (if image) */}
                      {asset?.type === 'image' && asset.thumbnailPath && (
                        <img
                          src={asset.thumbnailPath}
                          alt=""
                          style={{
                            height: '80%',
                            width: 'auto',
                            borderRadius: 3,
                            marginRight: 6,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {track.type === 'text' && clip.text ? clip.text : asset?.fileName || '片段'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {project.tracks.every(t => t.clips.length === 0) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'var(--color-text-muted)',
              fontSize: 13,
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              从左侧媒体库双击素材添加到时间轴
              <br />
              <span style={{ fontSize: 11 }}>或点击"模板"使用预设模板快速创建</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const smallBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  borderRadius: 4
}
