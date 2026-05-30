import { create } from 'zustand'

interface AppState {
  sidebarTab: 'media' | 'templates' | 'audio'
  setSidebarTab: (tab: 'media' | 'templates' | 'audio') => void

  activePanel: 'properties' | 'templates' | null
  setActivePanel: (panel: 'properties' | 'templates' | null) => void

  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void

  showTemplateWizard: boolean
  setShowTemplateWizard: (show: boolean) => void

  ffmpegReady: boolean
  ffmpegStatus: string
  setFfmpegStatus: (ready: boolean, status: string) => void

  isExporting: boolean
  exportProgress: number
  setIsExporting: (isExporting: boolean) => void
  setExportProgress: (progress: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarTab: 'media',
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),

  showExportDialog: false,
  setShowExportDialog: (show) => set({ showExportDialog: show }),

  showTemplateWizard: false,
  setShowTemplateWizard: (show) => set({ showTemplateWizard: show }),

  ffmpegReady: false,
  ffmpegStatus: '检查中...',
  setFfmpegStatus: (ready, status) => set({ ffmpegReady: ready, ffmpegStatus: status }),

  isExporting: false,
  exportProgress: 0,
  setIsExporting: (isExporting) => set({ isExporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
}))
