import { useAppStore } from '../../stores/useAppStore'
import { useTimelineStore } from '../../stores/useTimelineStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function StatusBar(): JSX.Element {
  const ffmpegReady = useAppStore((s) => s.ffmpegReady)
  const ffmpegStatus = useAppStore((s) => s.ffmpegStatus)
  const isExporting = useAppStore((s) => s.isExporting)
  const exportProgress = useAppStore((s) => s.exportProgress)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const totalDuration = useTimelineStore((s) => s.totalDuration)
  const zoom = useTimelineStore((s) => s.zoom)
  const project = useProjectStore((s) => s.project)

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      height: 28,
      background: 'var(--color-bg-panel)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 16,
      flexShrink: 0,
      fontSize: 11,
      color: 'var(--color-text-muted)'
    }}>
      {/* FFmpeg Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {ffmpegReady ? (
          <CheckCircle2 size={12} color="var(--color-success)" />
        ) : ffmpegStatus.includes('下载') ? (
          <Loader2 size={12} color="var(--color-warning)" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <AlertCircle size={12} color="var(--color-danger)" />
        )}
        <span>{ffmpegStatus}</span>
      </div>

      <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />

      {/* Timeline info */}
      <span>
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </span>
      <span>缩放: {zoom}px/s</span>
      <span>
        {project.config.width}×{project.config.height} @ {project.config.fps}fps
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Export progress */}
      {isExporting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          <span>导出中... {Math.round(exportProgress)}%</span>
          <div style={{
            width: 80,
            height: 4,
            background: 'var(--color-bg-hover)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${exportProgress}%`,
              height: '100%',
              background: 'var(--color-accent)',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
