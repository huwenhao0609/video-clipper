import { useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { MediaLibrary } from '../media/MediaLibrary'
import { TemplateLibrary } from '../template/TemplateLibrary'
import { Image, Layout, Music } from 'lucide-react'

export function Sidebar(): JSX.Element {
  const sidebarTab = useAppStore((s) => s.sidebarTab)
  const setSidebarTab = useAppStore((s) => s.setSidebarTab)

  const tabs = [
    { id: 'media' as const, label: '媒体', icon: <Image size={16} /> },
    { id: 'templates' as const, label: '模板', icon: <Layout size={16} /> },
    { id: 'audio' as const, label: '音频', icon: <Music size={16} /> },
  ]

  return (
    <div style={{
      width: 280,
      background: 'var(--color-bg-panel)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 8px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            style={{
              flex: 1,
              background: sidebarTab === tab.id ? 'var(--color-bg-surface)' : 'transparent',
              color: sidebarTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              border: 'none',
              borderBottom: sidebarTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              padding: '10px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {sidebarTab === 'media' && <MediaLibrary />}
        {sidebarTab === 'templates' && <TemplateLibrary />}
        {sidebarTab === 'audio' && <AudioPanel />}
      </div>
    </div>
  )
}

function AudioPanel(): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--color-text-muted)',
      padding: 24,
      textAlign: 'center',
      gap: 8
    }}>
      <Music size={32} />
      <p style={{ fontSize: 13 }}>导入背景音乐</p>
      <p style={{ fontSize: 11 }}>支持 MP3 / WAV / AAC</p>
      <button
        style={{
          marginTop: 12,
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        导入音频
      </button>
    </div>
  )
}
