import { useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { X, Loader2 } from 'lucide-react'

export function ExportDialog(): JSX.Element {
  const setShowExportDialog = useAppStore((s) => s.setShowExportDialog)
  const isExporting = useAppStore((s) => s.isExporting)
  const setIsExporting = useAppStore((s) => s.setIsExporting)
  const setExportProgress = useAppStore((s) => s.setExportProgress)
  const exportProgress = useAppStore((s) => s.exportProgress)
  const project = useProjectStore((s) => s.project)

  const [quality, setQuality] = useState(23)
  const [resolution, setResolution] = useState('1080x1080')

  const resolutionPresets = [
    { label: '正方形 (1080×1080)', value: '1080x1080', w: 1080, h: 1080 },
    { label: '竖版 (1080×1920)', value: '1080x1920', w: 1080, h: 1920 },
    { label: '横版 (1920×1080)', value: '1920x1080', w: 1920, h: 1080 },
    { label: '自定义', value: 'custom', w: project.config.width, h: project.config.height }
  ]

  const selectedPreset = resolutionPresets.find(p => p.value === resolution) || resolutionPresets[0]

  async function handleExport(): Promise<void> {
    if (!window.electronAPI) {
      alert('导出功能仅在 Electron 环境中可用')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      const outputPath = await window.electronAPI.project.export(project, {
        projectId: project.id,
        outputPath: '',
        width: selectedPreset.w,
        height: selectedPreset.h,
        fps: project.config.fps,
        quality
      })

      // Now run the actual export
      await window.electronAPI.ffmpeg.export({
        projectId: project.id,
        outputPath,
        width: selectedPreset.w,
        height: selectedPreset.h,
        fps: project.config.fps,
        quality
      })

      setExportProgress(100)
      alert('导出完成！')
      setShowExportDialog(false)
    } catch (err: any) {
      console.error('Export failed:', err)
      alert(`导出失败: ${err.message}`)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) setShowExportDialog(false)
      }}
    >
      <div style={{
        background: 'var(--color-bg-panel)',
        borderRadius: 12,
        width: 420,
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>导出视频</span>
          <button
            onClick={() => !isExporting && setShowExportDialog(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: isExporting ? 'default' : 'pointer',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Resolution */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>分辨率</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            style={selectStyle}
            disabled={isExporting}
          >
            {resolutionPresets.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Quality */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            画质 (CRF: {quality})
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>
              {quality <= 18 ? '极高' : quality <= 23 ? '高' : quality <= 28 ? '中' : '低'}
            </span>
          </label>
          <input
            type="range"
            min={15}
            max={35}
            step={1}
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            disabled={isExporting}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
            <span>高质量</span>
            <span>小文件</span>
          </div>
        </div>

        {/* Progress */}
        {isExporting && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              <span>导出中...</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <div style={{
              height: 6,
              background: 'var(--color-bg-hover)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${exportProgress}%`,
                background: 'var(--color-accent)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{
          background: 'var(--color-bg-surface)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--color-text-secondary)'
        }}>
          <div>输出尺寸: {selectedPreset.w}×{selectedPreset.h} @ {project.config.fps}fps</div>
          <div>项目时长: ~{Math.round(project.tracks.flatMap(t => t.clips).reduce((sum, c) => sum + c.duration, 0))}秒</div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            width: '100%',
            background: isExporting ? 'var(--color-bg-hover)' : 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: isExporting ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {isExporting ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              导出中...
            </>
          ) : (
            '导出视频'
          )}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 6
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: '8px 12px',
  color: 'var(--color-text-primary)',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer'
}
