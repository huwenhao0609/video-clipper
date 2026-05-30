import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { ExportDialog } from './components/export/ExportDialog'
import { useAppStore } from './stores/useAppStore'

export default function App(): JSX.Element {
  const showExportDialog = useAppStore((s) => s.showExportDialog)
  const setFfmpegStatus = useAppStore((s) => s.setFfmpegStatus)

  useEffect(() => {
    // Check FFmpeg status on startup
    async function checkFFmpeg(): Promise<void> {
      try {
        if (window.electronAPI) {
          const status = await window.electronAPI.ffmpeg.checkReady()
          setFfmpegStatus(status.ready, status.status)
        }
      } catch {
        setFfmpegStatus(false, 'FFmpeg 检查失败')
      }
    }

    checkFFmpeg()
  }, [setFfmpegStatus])

  return (
    <>
      <AppShell />
      {showExportDialog && <ExportDialog />}
    </>
  )
}
