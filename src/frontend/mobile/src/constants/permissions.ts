/**
 * Re-exports permission types and maps from `config/permissions.config.ts` (keep one source of truth).
 * Preset roles for onboarding demos — keys must match `PERMISSION_MAP` / backend `WidgetKeys`.
 */
import type { PermissionLevel } from '@/src/config/permissions.config';

export type { PermissionLevel, WidgetPermissionDef, Capability, AccessLevel } from '@/src/config/permissions.config';
export {
  WIDGET_KEYS,
  PERMISSION_MAP,
  WIDGET_PERMISSIONS,
  ALL_CAPABILITIES,
} from '@/src/config/permissions.config';

export interface RolePreset {
  name: string;
  widgets: Record<string, PermissionLevel>;
}

export interface OrgPreset {
  roles: RolePreset[];
}

export const ORG_PRESETS: Record<string, OrgPreset> = {
  university: {
    roles: [
      {
        name: 'Student',
        widgets: {
          grades: 'view',
          assignments: 'view',
          attendance: 'view',
          map: 'view',
          transport: 'view',
          events: 'view',
          documents: 'view',
          rooms: 'view',
          schedule: 'view',
        },
      },
      {
        name: 'Professor',
        widgets: {
          grades: 'edit',
          assignments: 'edit',
          attendance: 'edit',
          users: 'view',
          transport: 'view',
          schedule: 'edit',
          chat: 'edit',
        },
      },
      {
        name: 'Teaching Assistant',
        widgets: { grades: 'edit', assignments: 'edit', attendance: 'edit' },
      },
      {
        name: 'Dean',
        widgets: { news: 'edit', users: 'edit', map: 'view', schedule: 'view' },
      },
      {
        name: 'Registrar',
        widgets: {
          grades: 'admin',
          attendance: 'admin',
          documents: 'edit',
          users: 'edit',
        },
      },
      {
        name: 'Operations',
        widgets: {
          map: 'edit',
          transport: 'edit',
          rooms: 'edit',
          events: 'edit',
        },
      },
    ],
  },
  corporate: {
    roles: [
      {
        name: 'Employee',
        widgets: {
          tasks: 'view',
          documents: 'view',
          finance: 'view',
          map: 'view',
          rooms: 'view',
          schedule: 'view',
          chat: 'view',
        },
      },
      {
        name: 'Team Lead',
        widgets: { tasks: 'edit', users: 'view', rooms: 'view', chat: 'edit' },
      },
      {
        name: 'Project Manager',
        widgets: {
          tasks: 'admin',
          documents: 'edit',
          finance: 'view',
          users: 'view',
        },
      },
      {
        name: 'Director',
        widgets: { finance: 'view', news: 'edit', users: 'view' },
      },
      {
        name: 'HR Manager',
        widgets: {
          documents: 'admin',
          users: 'admin',
          finance: 'view',
          news: 'edit',
        },
      },
      {
        name: 'Operations',
        widgets: { map: 'edit', transport: 'edit', rooms: 'edit' },
      },
    ],
  },
};
