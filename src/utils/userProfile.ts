export interface UserProfile {
  name: string;
  email: string;
  role: string;
  company: string;
  avatarColor: string;
  initials: string;
}

export interface AppSettings {
  defaultRadiusKm: number;
  autoEnrichWithAi: boolean;
  exportFormat: 'xlsx' | 'vcf';
  notificationsEnabled: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Ashis Mehta',
  email: 'ashismhta@gmail.com',
  role: 'Lead Generation Specialist',
  company: 'Leadora PRO Enterprise',
  avatarColor: '#1a73e8',
  initials: 'AM'
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultRadiusKm: 5,
  autoEnrichWithAi: true,
  exportFormat: 'xlsx',
  notificationsEnabled: true
};

const PROFILE_KEY = 'leadora_user_profile_v1';
const SETTINGS_KEY = 'leadora_app_settings_v1';

export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          initials: getInitials(parsed.name || DEFAULT_PROFILE.name)
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getStoredUserProfile();
  const updated: UserProfile = {
    ...current,
    ...profile,
    initials: getInitials(profile.name || current.name)
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
  return updated;
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getStoredSettings();
  const updated: AppSettings = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
  return updated;
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
