import { useTimelineStore } from '../../stores/useTimelineStore'
import { useProjectStore } from '../../stores/useProjectStore'
import { useAppStore } from '../../stores/useAppStore'
import { X, Trash2 } from 'lucide-react'

export function PropertiesPanel(): JSX.Element {
  const selectedClipId = useTimelineStore((s) => s.selectedClipId)
  const selectClip = useTimelineStore((s) => s.selectClip)
  const project = useProjectStore((s) => s.project)
  const updateClip = useProjectStore((s) => s.updateClip)
  const removeClip = useProjectStore((s) => s.removeClip)
  const setActivePanel = useAppStore((s) => s.setActivePanel)

  // Find selected clip
  const selectedClip = project.tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId)

  if (!selectedClip) {
    return (
      <div style={{
        width: 280,
        background: 'var(--color-bg-panel)',
        borderLeft: '1px solid var(--color-border)',
        padding: 16,
        fontSize: 13,
        color: 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        flexShrink: 0
      }}>
        在时间轴上选择片段以编辑属性
      </div>
    )
  }

  return (
    <div style={{
      width: 280,
      background: 'var(--color-bg-panel)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>属性</span>
        <button
          onClick={() => selectClip(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: 2
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Properties Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* Duration */}
        <PropertyGroup label="时长">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={selectedClip.duration}
              onChange={(e) => updateClip(selectedClip.id, { duration: Math.max(0.1, parseFloat(e.target.value) || 0) })}
              step={0.1}
              min={0.1}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>秒</span>
          </div>
        </PropertyGroup>

        {/* Start Time */}
        <PropertyGroup label="起始时间">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={selectedClip.startTime}
              onChange={(e) => updateClip(selectedClip.id, { startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
              step={0.1}
              min={0}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>秒</span>
          </div>
        </PropertyGroup>

        {/* Trim Start */}
        <PropertyGroup label="裁剪起始">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={selectedClip.trimStart}
              onChange={(e) => updateClip(selectedClip.id, { trimStart: Math.max(0, parseFloat(e.target.value) || 0) })}
              step={0.1}
              min={0}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>秒</span>
          </div>
        </PropertyGroup>

        {/* Trim End */}
        <PropertyGroup label="裁剪结束">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={selectedClip.trimEnd}
              onChange={(e) => updateClip(selectedClip.id, { trimEnd: Math.max(selectedClip.trimStart + 0.1, parseFloat(e.target.value) || 0) })}
              step={0.1}
              min={selectedClip.trimStart + 0.1}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>秒</span>
          </div>
        </PropertyGroup>

        {/* Volume */}
        <PropertyGroup label="音量">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={selectedClip.volume}
            onChange={(e) => updateClip(selectedClip.id, { volume: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
          />
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {Math.round(selectedClip.volume * 100)}%
          </span>
        </PropertyGroup>

        {/* Speed */}
        <PropertyGroup label="速度">
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={selectedClip.speed}
            onChange={(e) => updateClip(selectedClip.id, { speed: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
          />
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {selectedClip.speed}x
          </span>
        </PropertyGroup>

        {/* Text Properties (shown for text clips) */}
        {selectedClip.type === 'text' && (
          <>
            <PropertyGroup label="文字内容">
              <input
                type="text"
                value={selectedClip.text || ''}
                onChange={(e) => updateClip(selectedClip.id, { text: e.target.value })}
                placeholder="输入文字..."
                style={{ ...inputStyle, width: '100%' }}
              />
            </PropertyGroup>

            <PropertyGroup label="字体大小">
              <input
                type="number"
                value={selectedClip.fontSize || 32}
                onChange={(e) => updateClip(selectedClip.id, { fontSize: parseInt(e.target.value) || 32 })}
                min={8}
                max={200}
                style={inputStyle}
              />
            </PropertyGroup>

            <PropertyGroup label="字体颜色">
              <input
                type="color"
                value={selectedClip.fontColor || '#FFFFFF'}
                onChange={(e) => updateClip(selectedClip.id, { fontColor: e.target.value })}
                style={{ width: 40, height: 30, border: 'none', cursor: 'pointer', background: 'transparent' }}
              />
            </PropertyGroup>
          </>
        )}

        {/* Delete Button */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => {
              removeClip(selectedClip.id)
              selectClip(null)
            }}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger)',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            <Trash2 size={14} />
            删除片段
          </button>
        </div>
      </div>
    </div>
  )
}

function PropertyGroup({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  padding: '6px 8px',
  color: 'var(--color-text-primary)',
  fontSize: 13,
  width: 80,
  outline: 'none'
}
