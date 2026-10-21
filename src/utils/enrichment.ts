import { LeadItem, SearchConfig } from '../types';

export async function findMoreContactsWithGeminiApi(
  searchConfig: SearchConfig,
  existingLeads: LeadItem[]
): Promise<{
  success: boolean;
  newLeads?: LeadItem[];
  count?: number;
  message?: string;
  warning?: string;
  error?: string;
}> {
  try {
    const existingNames = existingLeads.map((l) => l.businessName).filter(Boolean);
    const location =
      searchConfig.searchMode === 'proximity' && searchConfig.lat && searchConfig.lng
        ? (searchConfig.manualLocation && !searchConfig.manualLocation.includes('Detected Location')
            ? searchConfig.manualLocation
            : `${searchConfig.lat.toFixed(4)}, ${searchConfig.lng.toFixed(4)}`)
        : searchConfig.manualLocation;

    const res = await fetch('/api/leads/discover-more', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: location || 'Commercial District',
        categories: searchConfig.categories.length > 0 ? searchConfig.categories : [searchConfig.category].filter(Boolean),
        radiusKm: searchConfig.radiusKm || 5,
        lat: searchConfig.lat,
        lng: searchConfig.lng,
        searchMode: searchConfig.searchMode,
        country: searchConfig.country || 'India',
        tag: searchConfig.tag || '',
        existingNames
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      return {
        success: false,
        newLeads: [],
        count: 0,
        warning: data.warning,
        error: data.error || data.message || 'Failed to discover more contacts with Gemini'
      };
    }

    return {
      success: true,
      newLeads: data.newLeads || [],
      count: data.count || 0,
      warning: data.warning,
      message: data.message
    };
  } catch (err: any) {
    return {
      success: false,
      newLeads: [],
      count: 0,
      error: err.message || 'Network error while contacting Gemini'
    };
  }
}
