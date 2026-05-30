import { useProjectStore } from '../../stores/useProjectStore'
import { useAppStore } from '../../stores/useAppStore'
import { Save, FolderOpen, FilePlus, Video, Undo2, Redo2, Wand2 } from 'lucide-react'

export function TopBar(): JSX.Element {
  const projectName = useProjectStore((s) => s.project.name)
  const isDirty = useProjectStore((s) => s.isDirty)
  const setShowExportDialog = useAppStore((s) => s.setShowExportDialog)
  const showTemplateWizard = useAppStore((s) => s.showTemplateWizard)
  const setShowTemplateWizard = useAppStore((s) => s.setShowTemplateWizard)

  const handleExport = () => setShowExportDialog(true)

  return (
    <div style={{
      height: 44,
      background: 'var(--color-bg-panel)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 8,
      flexShrink: 0
    }}>
      {/* App Logo/Title */}
      <Video size={20} color="var(--color-accent)" />
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-accent)' }}>
        Video Clipper
      </span>

      <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 8px' }} />

      {/* Project Name */}
      <input
        value={projectName}
        onChange={(e) => useProjectStore.getState().setProjectName(e.target.value)}
        style={{
          background: 'transparent',
          border: '1px solid transparent',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 4,
          width: 200,
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.background = 'var(--color-bg-surface)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'transparent'
          e.target.style.background = 'transparent'
        }}
      />
      {isDirty && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>●</span>}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Toolbar Buttons */}
      <ToolbarButton icon={<FilePlus size={16} />} label="新建" onClick={() => useProjectStore.getState().newProject()} />
      <ToolbarButton icon={<FolderOpen size={16} />} label="打开" onClick={() => window.electronAPI?.project.load().catch(() => {})} />
      <ToolbarButton icon={<Save size={16} />} label="保存" onClick={() => window.electronAPI?.project.save(useProjectStore.getState().project).catch(() => {})} />

      <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px' }} />

      <ToolbarButton icon={<Undo2 size={16} />} label="撤销" onClick={() => {}} />
      <ToolbarButton icon={<Redo2 size={16} />} label="重做" onClick={() => {}} />

      <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px' }} />

      <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px' }} />

      <ToolbarButton
        icon={<Wand2 size={16} />}
        label="一键快剪"
        onClick={() => setShowTemplateWizard(!showTemplateWizard)}
        active={showTemplateWizard}
      />

      <button
        onClick={handleExport}
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 8
        }}
      >
        导出视频
      </button>
    </div>
  )
}

function ToolbarButton({ icon, label, onClick, active }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: active ? 'var(--color-bg-hover)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        border: 'none',
        borderRadius: 6,
        padding: '6px 8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--color-bg-hover)'
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }
      }}
    >
      {icon}
    </button>
  )
}
