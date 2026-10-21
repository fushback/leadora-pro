import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Plus, 
  Loader2, 
  ArrowRight,
  Tag,
  Check,
  X,
  History,
  Sparkles,
  Clock,
  Upload
} from 'lucide-react';
import { SearchConfig, CategoryItem } from '../types';
import { getCategoryIconComponent } from '../utils/categoryIcons';
import { GoogleMapPreview } from './GoogleMapPreview';
import { RecentSearchItem } from '../utils/recentSearches';
import { RecentSearchesModal } from './RecentSearchesModal';

interface SuggestionItem {
  placeId?: string;
  fullText: string;
  mainText: string;
  secondaryText: string;
}

interface SearchWorkflowProps {
  searchConfig: SearchConfig;
  setSearchConfig: React.Dispatch<React.SetStateAction<SearchConfig>>;
  categories: CategoryItem[];
  onOpenCategories: () => void;
  onExecuteScraper: (engine?: 'combined' | 'google' | 'gemini') => void;
  onOpenImportModal?: () => void;
  isLoading: boolean;
  pauseCountdown?: number | null;
  recentSearches?: RecentSearchItem[];
  onSelectRecentSearch?: (item: RecentSearchItem) => void;
  onClearRecentSearches?: () => void;
}

export const SearchWorkflow: React.FC<SearchWorkflowProps> = ({
  searchConfig,
  setSearchConfig,
  categories,
  onOpenCategories,
  onExecuteScraper,
  onOpenImportModal,
  isLoading,
  pauseCountdown = null,
  recentSearches = [],
  onSelectRecentSearch,
  onClearRecentSearches
}) => {
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearchingAutocomplete, setIsSearchingAutocomplete] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [activeEngine, setActiveEngine] = useState<'combined' | 'google' | 'gemini'>('combined');
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced Commercial Location Autocomplete
  useEffect(() => {
    const val = searchConfig.manualLocation.trim();
    if (searchConfig.searchMode !== 'manual' || val.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingAutocomplete(true);
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(val)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      } catch (err) {
        // ignore
      } finally {
        setIsSearchingAutocomplete(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchConfig.manualLocation, searchConfig.searchMode]);

  // Click outside to close location dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = async (s: SuggestionItem) => {
    const locText = s.fullText || `${s.mainText}, ${s.secondaryText}`;
    setSearchConfig((prev) => ({
      ...prev,
      manualLocation: locText
    }));
    setShowDropdown(false);

    if (s.placeId) {
      try {
        const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(s.placeId)}`);
        if (res.ok) {
          const details = await res.json();
          if (details.lat && details.lng) {
            setSearchConfig((prev) => ({
              ...prev,
              lat: Number(details.lat),
              lng: Number(details.lng),
              manualLocation: details.formattedAddress || locText
            }));
          }
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by browser.');
      return;
    }

    setIsDetectingLocation(true);
    setGeoStatus('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSearchConfig((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          manualLocation: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
        setGeoStatus(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.displayName) {
              const parts = data.displayName.split(',').map((s: string) => s.trim());
              const conciseLocation = parts.slice(0, 3).join(', ');
              setSearchConfig((prev) => ({
                ...prev,
                manualLocation: conciseLocation || data.displayName
              }));
              setGeoStatus(conciseLocation.slice(0, 32));
            }
          }
        } catch (e) {
          // ignore
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setGeoStatus(`GPS error: ${err.message}`);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const toggleCategorySelection = (catName: string) => {
    setSearchConfig((prev) => {
      const exists = prev.categories.includes(catName);
      let updated: string[];
      if (exists) {
        updated = prev.categories.filter((c) => c !== catName);
      } else {
        updated = [...prev.categories, catName];
      }
      return {
        ...prev,
        categories: updated,
        category: updated[0] || ''
      };
    });
  };

  const handleSelectAllCategories = () => {
    const allNames = categories.map((c) => c.name);
    setSearchConfig((prev) => ({
      ...prev,
      categories: allNames,
      category: allNames[0] || ''
    }));
  };

  const handleClearCategories = () => {
    setSearchConfig((prev) => ({
      ...prev,
      categories: [],
      category: ''
    }));
  };

  // Validation Rules
  const isLocationValid = searchConfig.searchMode === 'proximity'
    ? Boolean(searchConfig.lat && searchConfig.lng)
    : Boolean(searchConfig.manualLocation && searchConfig.manualLocation.trim().length > 0);

  const isTagValid = Boolean(searchConfig.tag && searchConfig.tag.trim().length > 0);
  const isCategoriesValid = searchConfig.categories.length > 0;

  const handleToggleSearchMode = () => {
    if (searchConfig.searchMode === 'manual') {
      setSearchConfig((p) => ({ ...p, searchMode: 'proximity' }));
      if (!searchConfig.lat || !searchConfig.lng) {
        handleDetectLocation();
      }
    } else {
      setSearchConfig((p) => ({ ...p, searchMode: 'manual' }));
    }
  };

  const handleSubmit = (engine: 'combined' | 'google' | 'gemini' = 'combined') => {
    setActiveEngine(engine);
    setHasAttemptedSubmit(true);
    if (!isLocationValid || !isCategoriesValid) {
      return;
    }
    // If tag is not specified, auto-default to Leads
    if (!searchConfig.tag || !searchConfig.tag.trim()) {
      setSearchConfig((prev) => ({
        ...prev,
        tag: 'Leads'
      }));
    }
    onExecuteScraper(engine);
  };

  return (
    <div className="w-100 mb-3 mb-md-4">
      {/* Location Section: Search location textbox on the left and location switch on the right in one row */}
      {searchConfig.searchMode === 'manual' ? (
        <div className="mb-3" ref={dropdownRef}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="location-search-input" className="form-label text-dark small fw-semibold mb-0" style={{ fontSize: '0.82rem' }}>
              Search Location <span className="text-danger">*</span>
            </label>
            {isSearchingAutocomplete && (
              <span className="text-primary small d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                <Loader2 size={11} className="animate-spin" />
                <span>Searching places...</span>
              </span>
            )}
          </div>

          {/* Search location textbox on left and location switch on right in one row */}
          <div className="d-flex align-items-center gap-2 position-relative">
            <div className="input-group flex-grow-1">
              <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                <MapPin size={16} className="text-primary" />
              </span>
              <input
                id="location-search-input"
                type="text"
                value={searchConfig.manualLocation}
                onChange={(e) => setSearchConfig((p) => ({ ...p, manualLocation: e.target.value }))}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Enter city, area, or commercial zone..."
                className={`form-control border-start-0 ps-1 ${hasAttemptedSubmit && !isLocationValid ? 'is-invalid border-danger' : ''}`}
                style={{ fontSize: '0.85rem', height: '38px' }}
                required
              />
              {searchConfig.manualLocation && (
                <button
                  type="button"
                  onClick={() => setSearchConfig((p) => ({ ...p, manualLocation: '', lat: undefined, lng: undefined }))}
                  className="btn btn-sm btn-link text-muted text-decoration-none px-2.5"
                  title="Clear location"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Switchable Toggle on the right: City Pin <-> GPS Navigation */}
            <button
              type="button"
              role="switch"
              aria-checked={false}
              onClick={handleToggleSearchMode}
              className="position-relative d-inline-flex align-items-center rounded-pill border p-0 cursor-pointer shadow-xs focus:outline-none flex-shrink-0"
              style={{
                width: '56px',
                height: '36px',
                backgroundColor: '#e8f0fe',
                borderColor: '#c2e7ff',
                transition: 'background-color 0.25s ease, border-color 0.25s ease'
              }}
              title="Switch to GPS Mode"
              aria-label="Switch to GPS Mode"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle text-white shadow-xs position-absolute"
                style={{
                  width: '28px',
                  height: '28px',
                  left: '4px',
                  backgroundColor: '#1a73e8',
                  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease'
                }}
              >
                <MapPin size={14} />
              </div>
            </button>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                className="position-absolute start-0 end-0 mt-1 bg-white border rounded shadow-lg overflow-hidden"
                style={{ top: '100%', zIndex: 1050, maxHeight: '220px', overflowY: 'auto' }}
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="dropdown-search-item"
                  >
                    <MapPin size={14} className="text-primary flex-shrink-0 mt-1 me-2" />
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-dark small text-start text-truncate">
                        {item.mainText}
                      </div>
                      <div className="text-muted text-start text-truncate" style={{ fontSize: '0.72rem' }}>
                        {item.secondaryText}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasAttemptedSubmit && !isLocationValid && (
            <div className="text-danger small mt-1" style={{ fontSize: '0.72rem' }}>
              Please enter a target location.
            </div>
          )}

          {/* Clean Search Radius Slider */}
          <div className="mt-2.5 pt-2">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                Search Radius:
              </span>
              <span className="badge badge-g-blue rounded-pill fw-bold" style={{ fontSize: '0.72rem', height: '20px', padding: '0 8px', lineHeight: 1 }}>
                {searchConfig.radiusKm} km
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>1 km</span>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={searchConfig.radiusKm}
                onChange={(e) => setSearchConfig((p) => ({ ...p, radiusKm: Number(e.target.value) }))}
                className="form-range flex-grow-1"
                aria-label="Search Radius"
              />
              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>50 km</span>
            </div>
          </div>
        </div>
      ) : (
        /* Proximity GPS Mode: Search location control on left and switch on right in one row */
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label className="form-label text-dark small fw-semibold mb-0" style={{ fontSize: '0.82rem' }}>
              Search Location <span className="text-danger">*</span>
            </label>
            {geoStatus && (
              <span className="text-muted small font-monospace text-truncate" style={{ fontSize: '0.72rem', maxWidth: '300px' }}>
                {geoStatus}
              </span>
            )}
          </div>

          {/* Search location control on left and location switch on right in one row */}
          <div className="d-flex align-items-center gap-2 position-relative">
            <div className="input-group flex-grow-1">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="btn btn-outline-primary d-flex align-items-center justify-content-center px-2.5 bg-white"
                style={{ height: '38px', minWidth: '40px' }}
                title="Detect GPS coordinates"
                aria-label="Detect GPS coordinates"
              >
                {isDetectingLocation ? <Loader2 size={15} className="animate-spin text-primary" /> : <Navigation size={15} className="text-primary" />}
              </button>
              <input
                type="text"
                readOnly
                value={
                  searchConfig.lat && searchConfig.lng
                    ? `${searchConfig.manualLocation || 'GPS Location'} (${searchConfig.lat.toFixed(4)}, ${searchConfig.lng.toFixed(4)})`
                    : (isDetectingLocation ? 'Detecting coordinates...' : 'Click icon to detect coordinates...')
                }
                className="form-control bg-white ps-2"
                style={{ fontSize: '0.84rem', height: '38px' }}
              />
            </div>

            {/* Switchable Toggle on the right: City Pin <-> GPS Navigation */}
            <button
              type="button"
              role="switch"
              aria-checked={true}
              onClick={handleToggleSearchMode}
              className="position-relative d-inline-flex align-items-center rounded-pill border p-0 cursor-pointer shadow-xs focus:outline-none flex-shrink-0"
              style={{
                width: '56px',
                height: '36px',
                backgroundColor: '#e6f4ea',
                borderColor: '#a8dab5',
                transition: 'background-color 0.25s ease, border-color 0.25s ease'
              }}
              title="Switch to City Search"
              aria-label="Switch to City Search"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle text-white shadow-xs position-absolute"
                style={{
                  width: '28px',
                  height: '28px',
                  left: 'calc(100% - 32px)',
                  backgroundColor: '#1e8e3e',
                  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease'
                }}
              >
                {isDetectingLocation ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} />
                )}
              </div>
            </button>
          </div>

          {/* Clean Search Radius Slider */}
          <div className="mt-2.5 pt-2">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="small text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                Search Radius:
              </span>
              <span className="badge badge-g-blue rounded-pill fw-bold" style={{ fontSize: '0.72rem', height: '20px', padding: '0 8px', lineHeight: 1 }}>
                {searchConfig.radiusKm} km
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>1 km</span>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={searchConfig.radiusKm}
                onChange={(e) => setSearchConfig((p) => ({ ...p, radiusKm: Number(e.target.value) }))}
                className="form-range flex-grow-1"
                aria-label="Search Radius"
              />
              <span className="text-muted small" style={{ fontSize: '0.7rem' }}>50 km</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map: Draggable, Zoomable, Click-to-select with bidirectional sync */}
      <div className="mb-3">
        <GoogleMapPreview
          lat={searchConfig.lat}
          lng={searchConfig.lng}
          radiusKm={searchConfig.radiusKm}
          locationName={searchConfig.manualLocation || (searchConfig.lat ? `${searchConfig.lat.toFixed(4)}, ${searchConfig.lng?.toFixed(4)}` : '')}
          onLocationSelect={(newLocationName, lat, lng) => {
            setSearchConfig((prev) => ({
              ...prev,
              manualLocation: newLocationName,
              lat,
              lng
            }));
          }}
          onCoordinatesResolved={(lat, lng) => {
            setSearchConfig((prev) => ({
              ...prev,
              lat,
              lng
            }));
          }}
        />
      </div>

      {/* Tag Field (Reduced to Half) and Recent Search Tiles kept in One Row */}
      <div className="row g-3 align-items-start mb-3">
        {/* Left: Tag Field (Optional metadata for leads) */}
        <div className="col-12 col-md-6">
          <label htmlFor="tag-input-field" className="form-label text-dark small fw-semibold mb-1" style={{ fontSize: '0.82rem' }}>
            Tag <span className="text-muted fw-normal">(Optional)</span>
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
              <Tag size={15} />
            </span>
            <input
              id="tag-input-field"
              type="text"
              value={searchConfig.tag || ''}
              onChange={(e) => setSearchConfig((p) => ({ ...p, tag: e.target.value }))}
              placeholder="e.g. Q4 Outreach, Hot Leads, Siliguri B2B..."
              className="form-control border-start-0 ps-1"
              style={{ fontSize: '0.85rem', height: '38px' }}
            />
            {searchConfig.tag && (
              <button
                type="button"
                onClick={() => setSearchConfig((p) => ({ ...p, tag: '' }))}
                className="btn btn-sm btn-link text-muted text-decoration-none px-2.5"
                title="Clear tag"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Recent Search Tiles Kept in One Row */}
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label className="form-label text-dark small fw-semibold mb-0" style={{ fontSize: '0.82rem' }}>
              Recent Searches
            </label>
            <button
              type="button"
              onClick={() => setIsRecentModalOpen(true)}
              className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
              style={{ fontSize: '0.74rem' }}
              title="View all recent searches in popup"
            >
              <span>View all</span>
              {recentSearches && recentSearches.length > 0 && (
                <span
                  className="badge rounded-pill fw-bold"
                  style={{
                    fontSize: '0.66rem',
                    backgroundColor: '#EBF2FE',
                    color: '#1A73E8',
                    padding: '1px 6px'
                  }}
                >
                  {Math.min(recentSearches.length, 20)}
                </span>
              )}
            </button>
          </div>

          {/* Recent Search Tiles: Single Horizontal Row */}
          <div
            className="d-flex align-items-center gap-2 overflow-x-auto flex-nowrap py-0.5 recent-search-tiles-row"
            style={{
              scrollbarWidth: 'thin',
              minHeight: '38px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {recentSearches && recentSearches.length > 0 ? (
              recentSearches.slice(0, 10).map((item, idx) => {
                const dotColor = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'][idx % 4];
                const label = item.manualLocation || item.tag || 'Search';
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => {
                      if (onSelectRecentSearch) onSelectRecentSearch(item);
                    }}
                    className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 rounded-pill px-2.5 py-1 text-nowrap shadow-xs hover-bg-light flex-shrink-0"
                    style={{
                      fontSize: '0.76rem',
                      height: '38px',
                      borderColor: '#CBD5E1',
                      backgroundColor: '#FFFFFF',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Click to load: ${label} (${item.resultsCount || 0} leads)`}
                  >
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{ width: '7px', height: '7px', backgroundColor: dotColor }}
                    />
                    <span className="fw-medium text-dark text-truncate" style={{ maxWidth: '120px' }}>
                      {label}
                    </span>
                    {item.resultsCount !== undefined && item.resultsCount > 0 && (
                      <span
                        className="badge rounded-pill fw-bold"
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: '#EBF2FE',
                          color: '#1A73E8',
                          padding: '1px 5px'
                        }}
                      >
                        {item.resultsCount}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div
                className="d-flex align-items-center gap-2 text-muted small px-3 py-1 rounded-3 bg-light border w-100"
                style={{ fontSize: '0.78rem', height: '38px', borderColor: '#E2E8F0' }}
              >
                <History size={13} className="text-muted flex-shrink-0" />
                <span className="text-truncate">Recent searches will appear here as quick-select tiles</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Categories: Selectable Tiles in the UI */}
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
          <label className="form-label text-dark small fw-semibold mb-0" style={{ fontSize: '0.82rem' }}>
            Target Categories <span className="text-danger">*</span>
            {searchConfig.categories.length > 0 && (
              <span className="badge badge-g-blue rounded-pill ms-2 fw-semibold" style={{ fontSize: '0.7rem' }}>
                {searchConfig.categories.length} selected
              </span>
            )}
          </label>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllCategories}
              className="btn btn-sm btn-link text-decoration-none text-primary p-0 small fw-medium"
              style={{ fontSize: '0.74rem' }}
            >
              Select All
            </button>
            <span className="text-muted" style={{ fontSize: '0.65rem' }}>&bull;</span>
            <button
              type="button"
              onClick={handleClearCategories}
              className="btn btn-sm btn-link text-decoration-none text-danger p-0 small fw-medium"
              style={{ fontSize: '0.74rem' }}
            >
              Clear
            </button>
            <span className="text-muted" style={{ fontSize: '0.65rem' }}>&bull;</span>
            <button
              type="button"
              onClick={onOpenCategories}
              className="btn btn-sm btn-link text-decoration-none text-secondary p-0 small fw-medium"
              style={{ fontSize: '0.74rem' }}
              title="Manage Categories"
            >
              Manage
            </button>
          </div>
        </div>

        {/* Scrollable Div containing all category tiles */}
        <div 
          className={`category-tiles-scroll ${
            hasAttemptedSubmit && !isCategoriesValid ? 'border-danger' : ''
          }`}
          title="Scroll to view and select all business categories"
        >
          <div className="d-flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = searchConfig.categories.includes(cat.name);
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => toggleCategorySelection(cat.name)}
                  className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 border text-start ${
                    isSelected
                      ? 'btn-g-blue text-white shadow-xs border-primary'
                      : 'btn-light bg-white text-secondary border hover-bg-light'
                  }`}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className={isSelected ? 'text-white' : 'text-primary'}>
                    {getCategoryIconComponent(cat.icon, 15)}
                  </span>
                  <span>{cat.name}</span>
                  {isSelected && (
                    <Check size={13} className="ms-0.5 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {hasAttemptedSubmit && !isCategoriesValid && (
          <div className="text-danger small mt-2" style={{ fontSize: '0.74rem' }}>
            Please select at least one category.
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar: Single Unified Call for Google Maps API + Gemini AI Web Intelligence */}
      <div
        className="sticky-bottom bg-white py-2.5 mt-4 border-top rounded-3 px-3 shadow-xs"
        style={{
          position: 'sticky',
          bottom: '62px',
          zIndex: 40,
          borderColor: '#E2E8F0',
          boxShadow: '0 -4px 14px rgba(15, 23, 42, 0.06)',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('combined')}
            disabled={isLoading || pauseCountdown !== null}
            className="btn btn-g-blue flex-grow-1 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm text-white"
            style={{ 
              fontSize: '0.96rem',
              height: '48px',
              background: pauseCountdown !== null 
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                : 'linear-gradient(135deg, #1A73E8 0%, #4F46E5 100%)',
              border: 'none',
              opacity: isLoading || pauseCountdown !== null ? 0.95 : 1,
              cursor: isLoading || pauseCountdown !== null ? 'wait' : 'pointer'
            }}
            title={
              pauseCountdown !== null
                ? `Pausing 3s. Search starts automatically in ${pauseCountdown}s...`
                : "Search verified real-world business listings combining Google Maps API and Gemini Web Intelligence within radius"
            }
          >
            {pauseCountdown !== null ? (
              <>
                <Clock size={19} className="animate-spin text-white flex-shrink-0" />
                <span className="fw-semibold">Starting in {pauseCountdown}s...</span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 size={19} className="animate-spin text-white flex-shrink-0" />
                <span className="fw-semibold">Searching (Batch of 100)...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Search</span>
                <Sparkles size={16} className="text-warning opacity-90" />
                <ArrowRight size={17} className="ms-1" />
              </>
            )}
          </button>

          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              disabled={isLoading || pauseCountdown !== null}
              className="btn btn-outline-secondary py-2.5 px-3 fw-semibold d-flex align-items-center justify-content-center gap-1.5 rounded-3 bg-white text-dark shadow-xs flex-shrink-0"
              style={{ height: '48px', fontSize: '0.88rem' }}
              title="Import an existing Excel (.xlsx), CSV, or JSON database straight into Step 2"
            >
              <Upload size={16} className="text-primary" />
              <span className="d-none d-sm-inline">Import File</span>
              <span className="d-inline d-sm-none">Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches Modal (Last 20 recent searches) */}
      <RecentSearchesModal
        isOpen={isRecentModalOpen}
        onClose={() => setIsRecentModalOpen(false)}
        recentSearches={recentSearches}
        onSelectSearch={(item) => {
          if (onSelectRecentSearch) {
            onSelectRecentSearch(item);
          }
          setIsRecentModalOpen(false);
        }}
        onClearSearches={() => {
          if (onClearRecentSearches) {
            onClearRecentSearches();
          }
        }}
      />
    </div>
  );
};
