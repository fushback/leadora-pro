export type SystemStatusType = 'active' | 'inactive' | 'on_hold' | 'upgradation';

export interface SystemStatusConfig {
  status: SystemStatusType;
  updatedAt: string;
  broadcastNotice?: string;
  maintenanceSchedule?: string;
  serverUptimeHours?: number;
  lastChangedBy?: string;
}

export interface StatusOptionMeta {
  type: SystemStatusType;
  label: string;
  dotColor: string;
  dotClass: string;
  blinkClass: string;
  badgeClass: string;
  badgeBg: string;
  description: string;
  detail: string;
  iconName: string;
}

export const STATUS_OPTIONS: Record<SystemStatusType, StatusOptionMeta> = {
  active: {
    type: 'active',
    label: 'System Active',
    dotColor: '#34A853',
    dotClass: 'dot-green',
    blinkClass: 'dot-blinking-green',
    badgeClass: 'badge-g-green',
    badgeBg: '#e6f4ea',
    description: 'System is running normally. All scraping & enrichment services are live.',
    detail: 'Green dot in the logo will blink to signify normal operational status.',
    iconName: 'CheckCircle2'
  },
  inactive: {
    type: 'inactive',
    label: 'System Inactive',
    dotColor: '#EA4335',
    dotClass: 'dot-red',
    blinkClass: 'dot-blinking-red',
    badgeClass: 'badge-g-red',
    badgeBg: '#fce8e6',
    description: 'System is paused or offline. Scrapers and API calls are suspended.',
    detail: 'Red dot in the logo will blink to alert users that the system is offline.',
    iconName: 'AlertOctagon'
  },
  on_hold: {
    type: 'on_hold',
    label: 'System On Hold',
    dotColor: '#FBBC04',
    dotClass: 'dot-yellow',
    blinkClass: 'dot-blinking-yellow',
    badgeClass: 'badge-g-yellow',
    badgeBg: '#fef7e0',
    description: 'System operations are temporarily paused for maintenance or rate-limiting.',
    detail: 'Yellow dot in the logo will blink to indicate temporary hold state.',
    iconName: 'Clock'
  },
  upgradation: {
    type: 'upgradation',
    label: 'System Upgradation',
    dotColor: '#4285F4',
    dotClass: 'dot-blue',
    blinkClass: 'dot-blinking-blue',
    badgeClass: 'badge-g-blue',
    badgeBg: '#e8f0fe',
    description: 'System upgrade, database migration, or new feature rollout in progress.',
    detail: 'Blue dot in the logo will blink while system upgrades are taking place.',
    iconName: 'RefreshCw'
  }
};

const STORAGE_KEY = 'leadora_system_status_config';

export const DEFAULT_SYSTEM_STATUS: SystemStatusConfig = {
  status: 'active',
  updatedAt: new Date().toISOString(),
  broadcastNotice: 'System is fully operational. All Google Places & Gemini engines ready.',
  maintenanceSchedule: 'Sunday 02:00 - 03:00 UTC (Optional)',
  serverUptimeHours: 720,
  lastChangedBy: 'Admin (Ashis Mehta)'
};

export const getStoredSystemStatus = (): SystemStatusConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM_STATUS;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.status && ['active', 'inactive', 'on_hold', 'upgradation'].includes(parsed.status)) {
      return {
        ...DEFAULT_SYSTEM_STATUS,
        ...parsed
      };
    }
    return DEFAULT_SYSTEM_STATUS;
  } catch {
    return DEFAULT_SYSTEM_STATUS;
  }
};

export const saveStoredSystemStatus = (config: SystemStatusConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Trigger custom event so any listeners across components update immediately
    window.dispatchEvent(new CustomEvent('leadora_status_changed', { detail: config }));
  } catch (err) {
    console.error('Failed to save system status to localStorage', err);
  }
};
