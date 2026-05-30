import { useState, useEffect } from 'react'
import type { Template } from '../../types'
import { Layout, Loader2 } from 'lucide-react'

export function TemplateLibrary(): JSX.Element {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTemplates(): Promise<void> {
      try {
        if (window.electronAPI) {
          const list = await window.electronAPI.templates.list()
          setTemplates(list)
        }
      } catch (err) {
        console.error('Failed to load templates:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        color: 'var(--color-text-muted)'
      }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 8, fontSize: 13 }}>加载模板...</span>
      </div>
    )
  }

  return (
    <div style={{ padding: 12, overflowY: 'auto', height: '100%' }}>
      {templates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 24,
          color: 'var(--color-text-muted)',
          fontSize: 13
        }}>
          暂无模板
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template }: { template: Template }): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'border-color 0.15s'
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'var(--color-bg-hover)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layout size={18} color="var(--color-accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {template.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {template.description}
            </div>
          </div>
          <span style={{
            fontSize: 10,
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg-hover)',
            padding: '2px 6px',
            borderRadius: 4
          }}>
            {template.config.width}×{template.config.height}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: 12,
          background: 'var(--color-bg-dark)'
        }}>
          {/* Slots */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            素材槽位 ({template.slots.length})
          </div>
          {template.slots.map((slot) => (
            <div key={slot.id} style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              padding: '4px 0',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{slot.label}</span>
              <span>{slot.duration}秒</span>
            </div>
          ))}

          {/* Text Overlays */}
          {template.textOverlays.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 6 }}>
                文字叠层 ({template.textOverlays.length})
              </div>
              {template.textOverlays.map((overlay) => (
                <div key={overlay.id} style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  padding: '2px 0'
                }}>
                  {overlay.placeholder}
                </div>
              ))}
            </>
          )}

          <button
            style={{
              width: '100%',
              marginTop: 10,
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            使用此模板
          </button>
        </div>
      )}
    </div>
  )
}
