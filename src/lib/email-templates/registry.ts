import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as slotAlert } from './slot-alert'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'slot-alert': slotAlert,
}
