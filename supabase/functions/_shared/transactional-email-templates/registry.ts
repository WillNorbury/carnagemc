/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

import { template as banAppealReceived } from './ban-appeal-received.tsx'
import { template as banAppealStatus } from './ban-appeal-status.tsx'
import { template as banAppealAdmin } from './ban-appeal-admin.tsx'
import { template as applicationReceived } from './application-received.tsx'
import { template as applicationStatus } from './application-status.tsx'
import { template as applicationAdmin } from './application-admin.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'ban-appeal-received': banAppealReceived,
  'ban-appeal-status': banAppealStatus,
  'ban-appeal-admin': banAppealAdmin,
  'application-received': applicationReceived,
  'application-status': applicationStatus,
  'application-admin': applicationAdmin,
}
