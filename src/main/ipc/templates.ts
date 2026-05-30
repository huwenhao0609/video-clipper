import { ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import type { Template } from '../../preload/types'

// Built-in templates directory (relative to app root in dev, or resources in prod)
function getTemplatesDir(): string {
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    return join(__dirname, '..', '..', '..', 'templates')
  }
  return join(process.resourcesPath, 'templates')
}

export function registerTemplateHandlers(): void {
  ipcMain.handle('templates:list', async (): Promise<Template[]> => {
    const templatesDir = getTemplatesDir()
    const templates: Template[] = []

    if (!existsSync(templatesDir)) {
      console.warn('Templates directory not found:', templatesDir)
      return getDefaultTemplates()
    }

    const fs = await import('fs/promises')
    try {
      const files = await fs.readdir(templatesDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = readFileSync(join(templatesDir, file), 'utf-8')
            templates.push(JSON.parse(content))
          } catch {
            console.error(`Failed to load template: ${file}`)
          }
        }
      }
    } catch {
      return getDefaultTemplates()
    }

    return templates.length > 0 ? templates : getDefaultTemplates()
  })

  ipcMain.handle('templates:load', async (_event, id: string): Promise<Template> => {
    const templatesDir = getTemplatesDir()
    const filePath = join(templatesDir, `${id}.json`)

    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    }

    // Fall back to default templates
    const defaults = getDefaultTemplates()
    const found = defaults.find(t => t.id === id)
    if (found) return found

    throw new Error(`Template not found: ${id}`)
  })
}

function getDefaultTemplates(): Template[] {
  return [
    {
      id: 'product-hero-v1',
      name: '产品展示',
      description: '单个产品多角度展示 + 文字叠加',
      category: 'jewelry',
      version: '1.0.0',
      config: { width: 1080, height: 1080, fps: 30 },
      slots: [
        {
          id: 'hero-shot',
          label: '主展示镜头',
          description: '产品正面，纯色背景（3秒）',
          acceptedTypes: ['video', 'image'],
          duration: 3.0,
          transitionOut: { type: 'fade', duration: 0.5 }
        },
        {
          id: 'detail-shot',
          label: '细节特写',
          description: '工艺或宝石特写（4秒）',
          acceptedTypes: ['video', 'image'],
          duration: 4.0,
          transitionIn: { type: 'fade', duration: 0.5 },
          transitionOut: { type: 'fade', duration: 0.3 }
        },
        {
          id: 'wearing-shot',
          label: '佩戴展示',
          description: '模特佩戴效果（5秒）',
          acceptedTypes: ['video'],
          duration: 5.0,
          transitionIn: { type: 'fade', duration: 0.3 },
          transitionOut: { type: 'fade', duration: 0.5 }
        }
      ],
      textOverlays: [
        {
          id: 'product-name',
          text: '{productName}',
          placeholder: '输入产品名称',
          x: 540,
          y: 80,
          fontSize: 52,
          fontColor: '#FFFFFF'
        },
        {
          id: 'price-tag',
          text: '{price}',
          placeholder: '输入价格',
          x: 540,
          y: 950,
          fontSize: 40,
          fontColor: '#FFD700'
        }
      ]
    },
    {
      id: 'jewelry-collection-v1',
      name: '饰品合集',
      description: '多款饰品轮播展示',
      category: 'jewelry',
      version: '1.0.0',
      config: { width: 1080, height: 1920, fps: 30 },
      slots: [
        {
          id: 'item-1',
          label: '饰品 1',
          description: '第一款饰品（3秒）',
          acceptedTypes: ['video', 'image'],
          duration: 3.0,
          transitionOut: { type: 'slide-left', duration: 0.5 }
        },
        {
          id: 'item-2',
          label: '饰品 2',
          description: '第二款饰品（3秒）',
          acceptedTypes: ['video', 'image'],
          duration: 3.0,
          transitionIn: { type: 'slide-left', duration: 0.5 },
          transitionOut: { type: 'slide-left', duration: 0.5 }
        },
        {
          id: 'item-3',
          label: '饰品 3',
          description: '第三款饰品（3秒）',
          acceptedTypes: ['video', 'image'],
          duration: 3.0,
          transitionIn: { type: 'slide-left', duration: 0.5 },
          transitionOut: { type: 'slide-left', duration: 0.5 }
        },
        {
          id: 'item-4',
          label: '饰品 4',
          description: '第四款饰品（3秒）',
          acceptedTypes: ['video', 'image'],
          duration: 3.0,
          transitionIn: { type: 'slide-left', duration: 0.5 }
        }
      ],
      textOverlays: [
        {
          id: 'collection-title',
          text: '{collectionTitle}',
          placeholder: '输入合集标题',
          x: 540,
          y: 100,
          fontSize: 48,
          fontColor: '#FFFFFF'
        }
      ]
    },
    {
      id: 'social-vertical-v1',
      name: '竖版社媒',
      description: '抖音/小红书竖版快速展示',
      category: 'social',
      version: '1.0.0',
      config: { width: 1080, height: 1920, fps: 30 },
      slots: [
        {
          id: 'main-shot',
          label: '主视频',
          description: '产品展示视频（8秒）',
          acceptedTypes: ['video'],
          duration: 8.0,
          transitionOut: { type: 'fade', duration: 0.3 }
        },
        {
          id: 'end-card',
          label: '结尾图',
          description: '产品图片 + 引导关注（3秒）',
          acceptedTypes: ['image'],
          duration: 3.0,
          transitionIn: { type: 'fade', duration: 0.3 }
        }
      ],
      textOverlays: [
        {
          id: 'product-name',
          text: '{productName}',
          placeholder: '产品名称',
          x: 540,
          y: 60,
          fontSize: 44,
          fontColor: '#FFFFFF'
        },
        {
          id: 'cta',
          text: '点击链接购买 👇',
          placeholder: '引导语',
          x: 540,
          y: 1820,
          fontSize: 32,
          fontColor: '#FF4444'
        }
      ]
    }
  ]
}
