import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Trash2,
  Search,
  X,
  MapPin,
  Tag,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { RecentSearchItem } from '../utils/recentSearches';

interface RecentSearchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentSearches: RecentSearchItem[];
  onSelectSearch: (item: RecentSearchItem) => void;
  onClearSearches: () => void;
}

export const RecentSearchesModal: React.FC<RecentSearchesModalProps> = ({
  isOpen,
  onClose,
  recentSearches,
  onSelectSearch,
  onClearSearches
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Take the last 20 searches and filter
  const last20Searches = useMemo(() => {
    return recentSearches.slice(0, 20);
  }, [recentSearches]);

  const filteredSearches = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return last20Searches;

    return last20Searches.filter((item) => {
      const matchLoc = (item.manualLocation || '').toLowerCase().includes(q);
      const matchCountry = (item.country || '').toLowerCase().includes(q);
      const matchCats = (item.categories || []).some((c) => c.toLowerCase().includes(q));
      return matchLoc || matchCountry || matchCats;
    });
  }, [last20Searches, filterQuery]);

  if (!isOpen) return null;

  // Format relative timestamp
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const colorDots = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Top 4-Color Gradient Shimmer Line */}
          <div className="quad-gradient-line" style={{ height: '3px' }} />

          {/* Modal Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-white">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '34px', height: '34px', backgroundColor: '#EBF2FE', color: '#1A73E8' }}
              >
                <History size={18} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold text-dark mb-0 fs-6">
                    Recent Searches
                  </h5>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '0.72rem' }}
                  >
                    Last {last20Searches.length} {last20Searches.length === 1 ? 'Search' : 'Searches'}
                  </span>
                </div>
                <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                  Select any previous search query to reload its location, filters, and discover leads.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Modal Subheader: Search Filter & Clear All Action */}
          {last20Searches.length > 0 && (
            <div className="px-4 py-2.5 bg-light border-bottom d-flex align-items-center justify-content-between gap-3">
              <div
                className="d-flex align-items-center bg-white rounded-pill px-3 py-1 border flex-grow-1"
                style={{ maxWidth: '380px', borderColor: '#CBD5E1' }}
              >
                <Search size={14} className="text-muted me-2 flex-shrink-0" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by city, area, or category..."
                  className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none text-dark"
                  style={{ fontSize: '0.8rem' }}
                  autoFocus
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery('')}
                    className="btn btn-sm btn-link p-0 text-muted ms-1 text-decoration-none"
                    title="Clear filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your recent search history?')) {
                    onClearSearches();
                    onClose();
                  }
                }}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 rounded-pill px-3 py-1 bg-white"
                style={{ fontSize: '0.75rem' }}
                title="Clear all recent search history"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            </div>
          )}

          {/* Modal Body: List of Last 20 Recent Searches */}
          <div className="modal-body p-3 p-md-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {last20Searches.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '56px', height: '56px', backgroundColor: '#F1F5F9', color: '#94A3B8' }}
                >
                  <History size={26} />
                </div>
                <h6 className="fw-semibold text-dark mb-1">No Recent Searches Yet</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: '320px', margin: '0 auto' }}>
                  Execute a search from Step 1 and your last 20 queries will automatically be saved here for instant access.
                </p>
              </div>
            ) : filteredSearches.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <Search size={22} className="mb-2 text-secondary opacity-60" />
                <p className="small mb-0">No recent searches match &ldquo;{filterQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {filteredSearches.map((item, idx) => {
                  const dotColor = colorDots[idx % colorDots.length];
                  const categoryCount = item.categories?.length || 0;
                  const categoriesPreview =
                    categoryCount > 0
                      ? item.categories.slice(0, 3).join(', ') + (categoryCount > 3 ? ` +${categoryCount - 3} more` : '')
                      : 'All Categories';

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        onSelectSearch(item);
                        onClose();
                      }}
                      className="p-3 rounded-3 border bg-white shadow-xs d-flex align-items-center justify-content-between gap-3 cursor-pointer hover-shadow transition-all"
                      style={{
                        borderColor: '#E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="d-flex align-items-start gap-3 min-w-0 flex-grow-1">
                        {/* Dot indicator */}
                        <div
                          className="rounded-circle mt-1.5 flex-shrink-0"
                          style={{ width: '10px', height: '10px', backgroundColor: dotColor }}
                        />

                        <div className="min-w-0 flex-grow-1">
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.88rem' }}>
                              {item.manualLocation || 'GPS Location'}
                            </span>
                            {item.country && (
                              <span
                                className="badge bg-light text-secondary border rounded-pill px-2 py-0.5"
                                style={{ fontSize: '0.68rem' }}
                              >
                                {item.country}
                              </span>
                            )}
                            <span
                              className="badge rounded-pill fw-bold"
                              style={{
                                fontSize: '0.68rem',
                                backgroundColor: '#EBF2FE',
                                color: '#1A73E8',
                                padding: '2px 8px'
                              }}
                            >
                              {item.resultsCount} leads found
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3 text-muted flex-wrap" style={{ fontSize: '0.74rem' }}>
                            <span className="d-flex align-items-center gap-1 text-truncate">
                              <Tag size={12} className="text-secondary flex-shrink-0" />
                              <span className="text-truncate" style={{ maxWidth: '300px' }}>
                                {categoriesPreview}
                              </span>
                            </span>

                            {item.radiusKm && (
                              <span className="d-flex align-items-center gap-1">
                                <MapPin size={12} className="text-secondary flex-shrink-0" />
                                <span>{item.radiusKm} km radius</span>
                              </span>
                            )}

                            {item.timestamp && (
                              <span className="d-flex align-items-center gap-1 text-secondary">
                                <Clock size={11} className="flex-shrink-0" />
                                <span>{formatTime(item.timestamp)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-g-blue rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 flex-shrink-0 shadow-xs"
                        style={{ fontSize: '0.78rem' }}
                        title="Load this search"
                      >
                        <span>Select</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer px-4 py-2.5 bg-light border-top d-flex align-items-center justify-content-between">
            <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
              Showing {filteredSearches.length} of {last20Searches.length} recent searches
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={onClose}
              style={{ fontSize: '0.78rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
