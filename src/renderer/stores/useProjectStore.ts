import { create } from 'zustand'
import type { Project, Track, Clip, BGMTrack, WatermarkConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'

function createDefaultProject(): Project {
  return {
    id: uuidv4(),
    name: '未命名项目',
    config: {
      width: 1080,
      height: 1080,
      fps: 30
    },
    tracks: [
      {
        id: uuidv4(),
        type: 'video',
        label: '视频轨道 1',
        clips: [],
        locked: false,
        muted: false
      },
      {
        id: uuidv4(),
        type: 'text',
        label: '文字轨道',
        clips: [],
        locked: false,
        muted: false
      }
    ],
    bgm: null,
    watermark: null,
    templateId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

interface ProjectState {
  project: Project
  isDirty: boolean

  // Project actions
  newProject: () => void
  loadProject: (project: Project) => void
  setProjectName: (name: string) => void
  setConfig: (config: Partial<Project['config']>) => void

  // Track actions
  addTrack: () => void
  removeTrack: (trackId: string) => void

  // Clip actions
  addClipToTrack: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  moveClip: (clipId: string, newStartTime: number) => void

  // BGM & Watermark
  setBGM: (bgm: BGMTrack | null) => void
  setWatermark: (watermark: WatermarkConfig | null) => void

  // Template
  setTemplateId: (id: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: createDefaultProject(),
  isDirty: false,

  newProject: () => set({ project: createDefaultProject(), isDirty: false }),
  loadProject: (project) => set({ project, isDirty: false }),
  setProjectName: (name) => set((state) => ({
    project: { ...state.project, name, updatedAt: new Date().toISOString() },
    isDirty: true
  })),
  setConfig: (config) => set((state) => ({
    project: {
      ...state.project,
      config: { ...state.project.config, ...config },
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  addTrack: () => set((state) => ({
    project: {
      ...state.project,
      tracks: [
        ...state.project.tracks,
        {
          id: uuidv4(),
          type: 'video' as const,
          label: `视频轨道 ${state.project.tracks.length + 1}`,
          clips: [],
          locked: false,
          muted: false
        }
      ],
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  removeTrack: (trackId) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.filter(t => t.id !== trackId),
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  addClipToTrack: (trackId, clipData) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              clips: [
                ...track.clips,
                { ...clipData, id: uuidv4(), trackId }
              ]
            }
          : track
      ),
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  removeClip: (clipId) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId)
      })),
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  updateClip: (clipId, updates) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        )
      })),
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  moveClip: (clipId, newStartTime) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, startTime: Math.max(0, newStartTime) } : clip
        )
      })),
      updatedAt: new Date().toISOString()
    },
    isDirty: true
  })),

  setBGM: (bgm) => set((state) => ({
    project: { ...state.project, bgm, updatedAt: new Date().toISOString() },
    isDirty: true
  })),

  setWatermark: (watermark) => set((state) => ({
    project: { ...state.project, watermark, updatedAt: new Date().toISOString() },
    isDirty: true
  })),

  setTemplateId: (id) => set((state) => ({
    project: { ...state.project, templateId: id, updatedAt: new Date().toISOString() },
    isDirty: true
  })),
}))
