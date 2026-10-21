export interface RecentSearchItem {
  id: string;
  manualLocation: string;
  country?: string;
  searchMode: 'manual' | 'proximity';
  radiusKm?: number;
  lat?: number;
  lng?: number;
  categories: string[];
  tag?: string;
  timestamp: number;
  resultsCount: number;
}

const STORAGE_KEY = 'leadagent_recent_searches_v1';

export function getRecentSearches(): RecentSearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 20);
    }
  } catch (e) {
    console.error('Failed to load recent searches from localStorage', e);
  }
  return [];
}

export function saveRecentSearch(
  config: {
    manualLocation: string;
    country?: string;
    searchMode: 'manual' | 'proximity';
    radiusKm?: number;
    lat?: number;
    lng?: number;
    categories: string[];
    tag?: string;
  },
  resultsCount: number
): RecentSearchItem[] {
  try {
    const current = getRecentSearches();
    const queryKey = `${config.searchMode}-${config.manualLocation.trim().toLowerCase()}-${config.country}-${config.categories.slice().sort().join(',')}-${config.tag || ''}`;

    // Remove duplicates so the fresh one is placed at index 0
    const filtered = current.filter((item) => {
      const itemKey = `${item.searchMode}-${item.manualLocation.trim().toLowerCase()}-${item.country}-${item.categories.slice().sort().join(',')}-${item.tag || ''}`;
      return itemKey !== queryKey;
    });

    const newItem: RecentSearchItem = {
      id: `search_${Date.now()}`,
      manualLocation: config.manualLocation,
      country: config.country,
      searchMode: config.searchMode,
      radiusKm: config.radiusKm,
      lat: config.lat,
      lng: config.lng,
      categories: config.categories,
      tag: config.tag,
      timestamp: Date.now(),
      resultsCount
    };

    const updated = [newItem, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save recent search to localStorage', e);
    return getRecentSearches();
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
