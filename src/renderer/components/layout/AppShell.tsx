import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { PreviewPlayer } from '../player/PreviewPlayer'
import { Timeline } from '../timeline/Timeline'
import { PropertiesPanel } from '../properties/PropertiesPanel'
import { useAppStore } from '../../stores/useAppStore'

export function AppShell(): JSX.Element {
  const activePanel = useAppStore((s) => s.activePanel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <PreviewPlayer />
          <Timeline />
        </div>

        {/* Right Properties Panel */}
        {activePanel && <PropertiesPanel />}
      </div>

      <StatusBar />
    </div>
  )
}
