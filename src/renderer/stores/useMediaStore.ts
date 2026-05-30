import { create } from 'zustand'
import type { MediaAsset } from '../types'

interface MediaState {
  assets: MediaAsset[]
  importing: boolean
  selectedAssetId: string | null

  setAssets: (assets: MediaAsset[]) => void
  addAssets: (assets: MediaAsset[]) => void
  removeAsset: (id: string) => void
  setImporting: (importing: boolean) => void
  selectAsset: (id: string | null) => void
  getAssetById: (id: string) => MediaAsset | undefined
}

export const useMediaStore = create<MediaState>((set, get) => ({
  assets: [],
  importing: false,
  selectedAssetId: null,

  setAssets: (assets) => set({ assets }),
  addAssets: (newAssets) => set((state) => ({
    assets: [...state.assets, ...newAssets]
  })),
  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter(a => a.id !== id),
    selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId
  })),
  setImporting: (importing) => set({ importing }),
  selectAsset: (id) => set({ selectedAssetId: id }),
  getAssetById: (id) => get().assets.find(a => a.id === id),
}))
