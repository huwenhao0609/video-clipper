import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { PreviewPlayer } from '../player/PreviewPlayer'
import { Timeline } from '../timeline/Timeline'
import { PropertiesPanel } from '../properties/PropertiesPanel'
import { QuickClip } from '../quick/QuickClip'
import { useAppStore } from '../../stores/useAppStore'
import { Wand2, Layout } from 'lucide-react'

export function AppShell(): JSX.Element {
  const activePanel = useAppStore((s) => s.activePanel)
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />

      {/* Mode Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 0',
        background: 'var(--color-bg-dark)',
        borderBottom: '1px solid var(--color-border)',
        gap: 4
      }}>
        <button
          onClick={() => setMode('quick')}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: mode === 'quick' ? 'var(--color-accent)' : 'transparent',
            color: mode === 'quick' ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s'
          }}
        >
          <Wand2 size={14} />
          一键快剪
        </button>
        <button
          onClick={() => setMode('advanced')}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: mode === 'advanced' ? 'var(--color-accent)' : 'transparent',
            color: mode === 'advanced' ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s'
          }}
        >
          <Layout size={14} />
          高级编辑
        </button>
      </div>

      {/* Content */}
      {mode === 'quick' ? (
        <QuickClip />
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <PreviewPlayer />
            <Timeline />
          </div>
          {activePanel && <PropertiesPanel />}
        </div>
      )}

      <StatusBar />
    </div>
  )
}
