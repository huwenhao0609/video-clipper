import { create } from 'zustand'
import type { Clip } from '../types'

interface TimelineState {
  currentTime: number
  isPlaying: boolean
  zoom: number // pixels per second
  scrollLeft: number
  selectedClipId: string | null
  snapping: boolean
  totalDuration: number

  seek: (time: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setZoom: (zoom: number) => void
  setScrollLeft: (scrollLeft: number) => void
  selectClip: (clipId: string | null) => void
  setSnapping: (snapping: boolean) => void
  setTotalDuration: (duration: number) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  zoom: 50, // 50px per second
  scrollLeft: 0,
  selectedClipId: null,
  snapping: true,
  totalDuration: 30, // default 30 seconds

  seek: (time) => set({ currentTime: Math.max(0, time) }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),
  setScrollLeft: (scrollLeft) => set({ scrollLeft: Math.max(0, scrollLeft) }),
  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setSnapping: (snapping) => set({ snapping }),
  setTotalDuration: (duration) => set({ totalDuration: Math.max(1, duration) }),
}))
