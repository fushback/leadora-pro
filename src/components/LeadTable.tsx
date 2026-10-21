import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Phone, 
  Mail, 
  MessageSquare, 
  Search, 
  ArrowRight,
  Loader2,
  CheckSquare,
  X,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Shield,
  AlertTriangle,
  XCircle,
  Sparkles,
  Globe,
  MapPin,
  CheckCircle,
  Building2,
  Clock,
  RefreshCw,
  Upload,
  ChevronDown,
  FileText,
  Code
} from 'lucide-react';
import { LeadItem, SearchConfig } from '../types';
import { generateExcelWorkbook, exportLeadsToCsv, exportLeadsToJson } from '../utils/excelGenerator';
import { CategoryDistributionChart } from './CategoryDistributionChart';
import { calculateDataIntegrity } from '../utils/dataIntegrity';
import { findMoreContactsWithGeminiApi } from '../utils/enrichment';
import { isAuthenticPlatformProfileUrl } from '../utils/formatters';
import { ContactsMapView } from './ContactsMapView';
import { DuplicateValidationModal } from './DuplicateValidationModal';
import { auditAndDeduplicateLeads, ValidationAuditResult } from '../utils/duplicateAudit';

interface LeadTableProps {
  leads: LeadItem[];
  searchConfig?: SearchConfig;
  onProceedToStep3: (selectedLeads?: LeadItem[]) => void;
  onLeadsEnriched?: (enrichedLeads: LeadItem[]) => void;
  onAddMoreLeads?: (newLeads: LeadItem[]) => void;
  onUpdateLeads?: (cleanedLeads: LeadItem[]) => void;
  onSearchLeads?: (category?: string) => void;
  onOpenImportModal?: () => void;
  isSearchingLeads?: boolean;
  isGoogleMapsExhausted?: boolean;
  exhaustedCategories?: Set<string>;
  pauseCountdown?: number | null;
  autoSearchNext?: boolean;
  onToggleAutoSearchNext?: (enabled: boolean, category?: string) => void;
  onToast?: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; duration?: number }) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({ 
  leads, 
  searchConfig,
  onProceedToStep3, 
  onLeadsEnriched,
  onAddMoreLeads,
  onUpdateLeads,
  onSearchLeads,
  onOpenImportModal,
  isSearchingLeads = false,
  isGoogleMapsExhausted = false,
  exhaustedCategories,
  pauseCountdown = null,
  autoSearchNext = false,
  onToggleAutoSearchNext,
  onToast
}) => {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isFindingMore, setIsFindingMore] = useState(false);
  const [isGeminiExhausted, setIsGeminiExhausted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'warning' | 'info'>('success');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Duplicate Validation & Audit State
  const [auditResult, setAuditResult] = useState<ValidationAuditResult | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleValidateDuplicates = () => {
    if (leads.length === 0) {
      if (onToast) {
        onToast({
          type: 'info',
          title: 'Table is Empty',
          message: 'No leads in Step 2 to validate. Import or search for leads first.'
        });
      }
      return;
    }

    const result = auditAndDeduplicateLeads(leads);
    setAuditResult(result);
    setIsAuditModalOpen(true);

    if (result.duplicateCount > 0) {
      if (onUpdateLeads) {
        onUpdateLeads(result.cleanedLeads);
      }
      if (onToast) {
        onToast({
          type: 'warning',
          title: `Cleaned ${result.duplicateCount} Duplicate ${result.duplicateCount === 1 ? 'Record' : 'Records'}`,
          message: `Removed ${result.duplicateCount} redundant duplicate items. Table now contains ${result.uniqueCount} verified unique leads.`
        });
      }
    } else {
      if (onToast) {
        onToast({
          type: 'success',
          title: '100% Unique Data Verified',
          message: `All ${result.totalChecked} records in Step 2 are verified unique with zero duplicates!`
        });
      }
    }
  };

  // Memoized duplicate count for live notification banner
  const detectedDuplicateCount = useMemo(() => {
    if (leads.length < 2) return 0;
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const seenPhones = new Set<string>();
    let dupCount = 0;

    for (const item of leads) {
      if (!item) continue;
      const id = (item.id || '').trim();
      const normName = (item.businessName || '').toLowerCase().trim();
      const cleanPhone = (item.contactNumber || '').replace(/\D/g, '').slice(-10);

      const isDup = (id && seenIds.has(id)) ||
                    (normName && seenNames.has(normName)) ||
                    (cleanPhone && cleanPhone.length >= 7 && seenPhones.has(cleanPhone));

      if (isDup) {
        dupCount++;
      } else {
        if (id) seenIds.add(id);
        if (normName) seenNames.add(normName);
        if (cleanPhone && cleanPhone.length >= 7) seenPhones.add(cleanPhone);
      }
    }
    return dupCount;
  }, [leads]);

  // Find More Contacts using Gemini across verified government registries and web directories
  const handleFindMoreWithGemini = async () => {
    if (!searchConfig || isFindingMore) return;
    setIsFindingMore(true);
    setStatusMessage(null);

    const result = await findMoreContactsWithGeminiApi(searchConfig, leads);
    setIsFindingMore(false);

    if (result.success && result.newLeads && result.newLeads.length > 0) {
      if (onAddMoreLeads) {
        onAddMoreLeads(result.newLeads);
      } else if (onLeadsEnriched) {
        onLeadsEnriched([...leads, ...result.newLeads]);
      }
      setStatusType('success');
      const successMsg = result.message || `Discovered and added ${result.newLeads.length} new verified commercial contacts across government portals and business directories!`;
      setStatusMessage(successMsg);
      if (onToast) {
        onToast({
          type: 'success',
          title: 'Contacts Discovered',
          message: successMsg,
          duration: 3000
        });
      }
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setIsGeminiExhausted(true);
      setStatusType(result.error ? 'warning' : 'info');
      const exhaustedMsg = result.error || result.message || 'All available verified commercial contacts in this radius and category have already been discovered.';
      setStatusMessage(exhaustedMsg);
      if (onToast) {
        onToast({
          type: 'info',
          title: 'All Contacts Discovered',
          message: exhaustedMsg,
          duration: 3000
        });
      }
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Sorting state: sort by lead name, category, data integrity, or source
  const [sortField, setSortField] = useState<'businessName' | 'category' | 'integrity' | 'source' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Group leads by category for tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const cat = l.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const uniqueCategories = Object.keys(categoryCounts);

  // Average Data Integrity score across all leads
  const avgIntegrity = useMemo(() => {
    if (leads.length === 0) return 0;
    const total = leads.reduce((acc, l) => acc + calculateDataIntegrity(l).score, 0);
    return Math.round(total / leads.length);
  }, [leads]);

  // Filter leads based on active category tab & search query
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesCategory =
        selectedCategoryTab === 'all' || item.category === selectedCategoryTab;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.businessName.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        item.contactNumber.includes(q) ||
        item.email.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [leads, selectedCategoryTab, searchQuery]);

  // Handle column header sorting toggle
  const handleSort = (field: 'businessName' | 'category' | 'integrity' | 'source') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      // For integrity, descending (100% high quality first) is the best default
      setSortDirection(field === 'integrity' ? 'desc' : 'asc');
    }
  };

  // Sort filtered leads by lead name, category, data integrity score, or source
  const sortedLeads = useMemo(() => {
    if (!sortField) return filteredLeads;

    return [...filteredLeads].sort((a, b) => {
      if (sortField === 'integrity') {
        const scoreA = calculateDataIntegrity(a).score;
        const scoreB = calculateDataIntegrity(b).score;
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }

      if (sortField === 'source') {
        const srcA = (a.specificSource || a.source || '').toLowerCase();
        const srcB = (b.specificSource || b.source || '').toLowerCase();
        const comparison = srcA.localeCompare(srcB);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const valA = (a[sortField] || '').trim().toLowerCase();
      const valB = (b[sortField] || '').trim().toLowerCase();

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortDirection]);

  // Selection state helpers based on sorted/filtered view
  const visibleSelectedCount = useMemo(() => {
    return sortedLeads.filter(l => selectedIds.has(l.id)).length;
  }, [sortedLeads, selectedIds]);

  const isAllVisibleSelected = sortedLeads.length > 0 && visibleSelectedCount === sortedLeads.length;
  const isSomeVisibleSelected = visibleSelectedCount > 0 && !isAllVisibleSelected;

  // Sync indeterminate state on the header checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeVisibleSelected;
    }
  }, [isSomeVisibleSelected]);

  // Toggle single lead selection
  const handleToggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all visible
  const handleToggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllVisibleSelected) {
        sortedLeads.forEach(l => next.delete(l.id));
      } else {
        sortedLeads.forEach(l => next.add(l.id));
      }
      return next;
    });
  };

  // Select all leads in database
  const handleSelectAllInDatabase = () => {
    setSelectedIds(new Set(leads.map(l => l.id)));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Compute which leads to export: if any selected, export selected; else export sorted leads
  const leadsToExport = useMemo(() => {
    if (selectedIds.size === 0) return sortedLeads;
    return sortedLeads.filter(l => selectedIds.has(l.id));
  }, [sortedLeads, selectedIds]);

  // Dual-Path Excel Download for chosen contacts
  const handleDownloadExcel = async () => {
    if (leadsToExport.length === 0) return;
    setIsExporting(true);

    try {
      const suffix = selectedIds.size > 0 ? `Selected_${leadsToExport.length}` : 'All';
      const filename = `B2B_Leads_${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      generateExcelWorkbook(leadsToExport, filename);
    } catch (clientErr: any) {
      console.warn('Client Excel generation fallback to server API:', clientErr);
      try {
        const response = await fetch('/api/export/excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: leadsToExport })
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const suffix = selectedIds.size > 0 ? `Selected_${leadsToExport.length}` : 'All';
          a.download = `B2B_Leads_${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 2000);
        } else {
          alert('Could not export file.');
        }
      } catch (serverErr: any) {
        alert(`Export error: ${serverErr.message}`);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showExportMenu]);

  const handleDownloadCsv = () => {
    if (leadsToExport.length === 0) return;
    const suffix = selectedIds.size > 0 ? `Selected_${leadsToExport.length}` : 'All';
    const filename = `B2B_Leads_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportLeadsToCsv(leadsToExport, filename);
    setShowExportMenu(false);
  };

  const handleDownloadJson = () => {
    if (leadsToExport.length === 0) return;
    const suffix = selectedIds.size > 0 ? `Selected_${leadsToExport.length}` : 'All';
    const filename = `B2B_Leads_${suffix}_${new Date().toISOString().slice(0, 10)}.json`;
    exportLeadsToJson(leadsToExport, filename);
    setShowExportMenu(false);
  };

  // Handler for proceeding to VCF
  const handleProceedToVcf = () => {
    onProceedToStep3(leadsToExport);
  };

  return (
    <>
      <div className="g-card p-3 p-sm-4 mb-3 mb-md-4">
      {/* Top Header */}
      <div className="d-flex align-items-sm-center justify-content-between flex-column flex-sm-row gap-2.5 pb-2.5 mb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fs-5 fw-bold text-dark mb-0">Leads</h2>
            <span className="badge badge-g-green rounded-pill fw-bold d-inline-flex align-items-center justify-content-center" style={{ fontSize: '0.68rem', height: '20px', padding: '0 8px', lineHeight: 1 }}>
              Step 2
            </span>
            {leads.length > 0 && (
              <span 
                className="badge bg-light text-secondary border rounded-pill d-none d-sm-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                title="Average contact data completeness across all leads (Phone, Email, Address)"
              >
                <ShieldCheck size={11} className="text-primary" />
                <span>Avg Integrity: <strong>{avgIntegrity}%</strong></span>
              </span>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-sm-auto">
          {/* Unified Search More Leads Button (Google Maps API + Gemini AI Web Intelligence) */}
          {onSearchLeads && (() => {
            const isCurrentCategoryExhausted = selectedCategoryTab === 'all'
              ? isGoogleMapsExhausted
              : (exhaustedCategories ? exhaustedCategories.has(selectedCategoryTab) : false);
            const activeCategoryLabel = selectedCategoryTab === 'all' ? '' : selectedCategoryTab;

            return (
              <div className="d-flex align-items-center gap-1.5 flex-fill flex-sm-grow-0">
                <button
                  type="button"
                  onClick={() => onSearchLeads(selectedCategoryTab !== 'all' ? selectedCategoryTab : undefined)}
                  disabled={isSearchingLeads || isCurrentCategoryExhausted || pauseCountdown !== null}
                  className={`btn btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill rounded-pill shadow-sm transition-all text-white ${
                    isCurrentCategoryExhausted
                      ? 'btn-secondary opacity-75'
                      : pauseCountdown !== null
                      ? 'btn-warning text-dark fw-semibold'
                      : 'btn-g-blue'
                  }`}
                  style={
                    isCurrentCategoryExhausted || pauseCountdown !== null
                      ? {}
                      : { background: 'linear-gradient(135deg, #1A73E8 0%, #4F46E5 100%)', border: 'none' }
                  }
                  title={
                    isCurrentCategoryExhausted
                      ? `All available verified businesses for ${selectedCategoryTab === 'all' ? 'this search' : selectedCategoryTab} have been discovered in this radius.`
                      : pauseCountdown !== null
                      ? `Pausing 3s. Next search starts automatically in ${pauseCountdown}s...`
                      : `Search next batch of 100 verified leads for ${selectedCategoryTab === 'all' ? 'all categories' : selectedCategoryTab} combining Google Maps API and Gemini Web Intelligence.`
                  }
                >
                  {pauseCountdown !== null ? (
                    <>
                      <Clock size={14} className="animate-spin text-dark flex-shrink-0" />
                      <span>Starting in {pauseCountdown}s...</span>
                    </>
                  ) : isSearchingLeads ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white flex-shrink-0" />
                      <span>Searching {activeCategoryLabel ? `${activeCategoryLabel} ` : ''}(Batch of 100)...</span>
                    </>
                  ) : isCurrentCategoryExhausted ? (
                    <>
                      <CheckCircle size={14} />
                      <span>All {selectedCategoryTab === 'all' ? 'Leads' : selectedCategoryTab} Discovered</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Search More {activeCategoryLabel ? `${activeCategoryLabel} ` : ''}(Batch of 100)</span>
                      <Sparkles size={13} className="text-warning" />
                    </>
                  )}
                </button>

                {/* Auto Search Next Toggle Switch */}
                {onToggleAutoSearchNext && !isCurrentCategoryExhausted && (
                  <button
                    type="button"
                    onClick={() => onToggleAutoSearchNext(!autoSearchNext, selectedCategoryTab !== 'all' ? selectedCategoryTab : undefined)}
                    className={`btn btn-sm py-1 px-2 rounded-pill d-inline-flex align-items-center gap-1 transition-all ${
                      autoSearchNext
                        ? 'btn-success text-white shadow-xs fw-semibold'
                        : 'btn-outline-secondary text-secondary bg-white'
                    }`}
                    style={{ fontSize: '0.74rem' }}
                    title={
                      autoSearchNext 
                        ? `Auto-Search is active for ${selectedCategoryTab === 'all' ? 'all categories' : selectedCategoryTab}: Takes a 3s pause between batches and searches automatically until exhausted` 
                        : `Enable Auto-Search for ${selectedCategoryTab === 'all' ? 'all categories' : selectedCategoryTab}: Takes a 3s pause between batches and automatically fetches next 100 leads`
                    }
                  >
                    <RefreshCw size={11} className={autoSearchNext ? 'animate-spin' : ''} />
                    <span>Auto-Search: {autoSearchNext ? 'ON' : 'OFF'}</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Import Spreadsheet / Leads File Button */}
          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill flex-sm-grow-0 rounded-pill shadow-xs bg-white text-dark"
              title="Import leads from Excel (.xlsx), CSV, or JSON and continue searching without duplicates"
            >
              <Upload size={14} className="text-primary" />
              <span>Import</span>
            </button>
          )}

          {/* Validate & Clean Duplicates Button */}
          <button
            type="button"
            onClick={handleValidateDuplicates}
            disabled={leads.length === 0}
            className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill flex-sm-grow-0 rounded-pill shadow-xs bg-white text-primary"
            title="Audit table data for duplicates (by Place ID, Business Name, or Phone) and remove redundant records"
          >
            <ShieldCheck size={14} className="text-primary" />
            <span>Validate Data</span>
          </button>

          {/* Export Group with Dropdown */}
          <div className="position-relative d-inline-flex flex-fill flex-sm-grow-0" ref={exportMenuRef}>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={leads.length === 0 || isExporting}
              className="btn btn-g-green btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-grow-1 rounded-pill rounded-end-0 shadow-sm"
              title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected leads to Excel` : `Export all ${leads.length} leads to Excel`}
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span>
                {selectedIds.size > 0 
                  ? `Export (${selectedIds.size})` 
                  : 'Download Spreadsheet'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={leads.length === 0 || isExporting}
              className="btn btn-g-green btn-sm px-2 py-2 rounded-pill rounded-start-0 border-start border-white border-opacity-25 shadow-sm"
              title="More export formats (CSV, JSON)"
              aria-label="More export formats"
            >
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div 
                className="dropdown-menu show position-absolute end-0 top-100 mt-1 shadow-lg border rounded-3 py-1 bg-white"
                style={{ zIndex: 1050, minWidth: '190px' }}
              >
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 small cursor-pointer"
                  onClick={() => {
                    handleDownloadExcel();
                    setShowExportMenu(false);
                  }}
                >
                  <FileSpreadsheet size={15} className="text-success" />
                  <div>
                    <div className="fw-semibold text-dark">Excel (.xlsx)</div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Multi-sheet with Place IDs</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 small border-top cursor-pointer"
                  onClick={handleDownloadCsv}
                >
                  <FileText size={15} className="text-primary" />
                  <div>
                    <div className="fw-semibold text-dark">CSV (.csv)</div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Tabular with Place IDs</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 small border-top cursor-pointer"
                  onClick={handleDownloadJson}
                >
                  <Code size={15} className="text-warning" />
                  <div>
                    <div className="fw-semibold text-dark">JSON (.json)</div>
                    <div className="text-muted" style={{ fontSize: '0.68rem' }}>Raw records with Place IDs</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Proceed to VCF in Google Blue #4285F4 */}
          <button
            type="button"
            onClick={handleProceedToVcf}
            disabled={leads.length === 0}
            className={`btn btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3 py-2 flex-fill flex-sm-grow-0 rounded-pill shadow-sm ${
              selectedIds.size > 0 ? 'btn-g-blue' : 'btn-outline-g-blue'
            }`}
            title={selectedIds.size > 0 ? `Proceed to VCF with ${selectedIds.size} selected leads` : 'Proceed to VCF'}
          >
            <span>
              {selectedIds.size > 0 
                ? `Proceed to VCF (${selectedIds.size})` 
                : 'Proceed to VCF'}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Duplicate Data Detected Banner */}
      {detectedDuplicateCount > 0 && (
        <div className="alert py-2.5 px-3 mb-2.5 d-flex align-items-center justify-content-between rounded-3 border-0 shadow-xs bg-warning-subtle text-warning-emphasis">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={16} className="text-warning-emphasis flex-shrink-0" />
            <div style={{ fontSize: '0.82rem' }}>
              <strong>Notice:</strong> Found <strong>{detectedDuplicateCount} duplicate {detectedDuplicateCount === 1 ? 'record' : 'records'}</strong> in this table.
            </div>
          </div>
          <button
            type="button"
            onClick={handleValidateDuplicates}
            className="btn btn-sm btn-warning text-dark fw-semibold px-3 py-1 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
            style={{ fontSize: '0.74rem' }}
          >
            <ShieldCheck size={13} />
            <span>Validate &amp; Clean</span>
          </button>
        </div>
      )}

      {/* Gemini AI Web Discovery Notification Banner */}
      {statusMessage && (
        <div className={`alert py-2 px-3 mb-2.5 d-flex align-items-center justify-content-between rounded-3 border-0 shadow-xs ${
          statusType === 'warning' 
            ? 'alert-warning bg-warning-subtle text-warning-emphasis' 
            : 'alert-success bg-success-subtle text-success-emphasis'
        }`}>
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={15} className={`flex-shrink-0 ${statusType === 'warning' ? 'text-warning' : 'text-success'}`} />
            <span style={{ fontSize: '0.8rem' }}>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="btn-close shadow-none"
            style={{ fontSize: '0.7rem' }}
          />
        </div>
      )}

      {/* Recharts Lead Category Distribution Summary (2-Way Synced with Filter Below) */}
      <CategoryDistributionChart
        leads={leads}
        selectedCategory={selectedCategoryTab}
        onSelectCategory={(cat) => setSelectedCategoryTab(cat)}
      />

      {/* Multi-Select Floating Action Alert Bar */}
      {selectedIds.size > 0 && (
        <div className="alert alert-primary py-2 px-3 mb-2.5 d-flex align-items-center justify-content-between flex-wrap gap-2 rounded-3 border-0 bg-primary-subtle text-primary-emphasis shadow-xs">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <CheckSquare size={16} className="text-primary flex-shrink-0" />
            <span className="fw-semibold small" style={{ fontSize: '0.8rem' }}>
              <strong>{selectedIds.size}</strong> of {leads.length} contacts selected
            </span>
            {selectedIds.size < leads.length && (
              <button
                type="button"
                onClick={handleSelectAllInDatabase}
                className="btn btn-sm btn-link p-0 text-decoration-underline text-primary fw-semibold"
                style={{ fontSize: '0.75rem' }}
              >
                Select all {leads.length} leads
              </button>
            )}
          </div>
          <div className="d-flex align-items-center gap-1.5 ms-auto">
            <button
              type="button"
              onClick={handleClearSelection}
              className="btn btn-outline-secondary btn-sm py-0.5 px-2.5 bg-white rounded-pill d-flex align-items-center gap-1"
              style={{ fontSize: '0.72rem' }}
            >
              <X size={12} />
              <span>Clear selection</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs with Horizontal Scroll & Quick Search */}
      <div className="d-flex align-items-stretch align-items-sm-center justify-content-between flex-column flex-sm-row gap-2 mb-3">
        {/* Horizontal Scroll Category Filter */}
        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0 overflow-hidden">
          <div 
            className="category-filter-scroll flex-grow-1"
            title="Scroll horizontally to see all category filters"
          >
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-nowrap flex-shrink-0 fw-semibold ${
                selectedCategoryTab === 'all'
                  ? 'btn-g-blue text-white shadow-xs'
                  : 'btn-light border text-secondary bg-white hover-bg-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              All Leads ({leads.length})
            </button>

            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryTab(cat)}
                className={`btn btn-sm rounded-pill px-2.5 px-sm-3 py-1.5 text-nowrap flex-shrink-0 d-flex align-items-center gap-1.5 fw-semibold ${
                  selectedCategoryTab === cat
                    ? 'btn-g-blue text-white shadow-xs'
                    : 'btn-light border text-secondary bg-white hover-bg-light'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                <span>{cat}</span>
                <span
                  className={`badge rounded-pill d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0 ${
                    selectedCategoryTab === cat ? 'bg-white text-primary' : 'bg-light text-dark border'
                  }`}
                  style={{
                    fontSize: '0.65rem',
                    height: '18px',
                    minWidth: '20px',
                    padding: '0 5px',
                    lineHeight: 1
                  }}
                >
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {sortField && (
            <span
              className="badge badge-g-blue d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill flex-shrink-0 shadow-xs"
              style={{ fontSize: '0.73rem', cursor: 'pointer' }}
              onClick={() => setSortField(null)}
              title="Click to reset column sorting"
            >
              <span>
                Sorted by {sortField === 'businessName' ? 'Lead Name' : sortField === 'category' ? 'Category' : 'Data Integrity'} ({sortDirection === 'asc' ? (sortField === 'integrity' ? 'Low→High' : 'A→Z') : (sortField === 'integrity' ? 'High→Low' : 'Z→A')})
              </span>
              <X size={12} className="ms-0.5" />
            </span>
          )}

          {/* Search Field */}
          <div className="input-group input-group-sm flex-shrink-0" style={{ minWidth: '180px', maxWidth: '280px' }}>
            <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
              <Search size={14} className="text-primary" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter leads..."
              className="form-control border-start-0 ps-1"
              style={{ fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {/* Active Category Filter Notice */}
      {selectedCategoryTab !== 'all' && (
        <div 
          className="alert alert-info py-2 px-3 mb-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2 border-0 shadow-xs" 
          style={{ fontSize: '0.82rem', backgroundColor: '#EFF6FF', color: '#1E40AF', borderLeft: '4px solid #3B82F6' }}
        >
          <div className="d-flex align-items-center gap-2">
            <Tag size={14} className="text-primary flex-shrink-0" />
            <span>
              Filtered view: Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> total leads in <strong>"{selectedCategoryTab}"</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('all')}
            className="btn btn-sm btn-outline-primary py-0.5 px-2.5 rounded-pill fw-semibold bg-white"
            style={{ fontSize: '0.75rem' }}
          >
            Show All {leads.length} Leads &rarr;
          </button>
        </div>
      )}

      {/* Table with responsive horizontal touch scrolling */}
      <div 
        className="table-responsive border rounded bg-white" 
        style={{ maxHeight: '520px', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}
      >
        <table className="table table-hover table-striped align-middle mb-0" style={{ fontSize: '0.8rem', width: '100%' }}>
          <thead className="table-light sticky-top text-uppercase text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.4px', zIndex: 5 }}>
            <tr>
              {/* Multi-Select Header Checkbox */}
              <th className="py-2 px-2 text-center" style={{ width: '40px' }}>
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  className="form-check-input"
                  checked={isAllVisibleSelected}
                  onChange={handleToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                  title="Select / Deselect all visible leads"
                />
              </th>
              <th className="py-2 px-2" style={{ minWidth: '34px' }}>#</th>

              {/* Sortable Business Name Header */}
              <th 
                className="py-2 px-2.5 table-sort-header" 
                style={{ minWidth: '170px' }}
                onClick={() => handleSort('businessName')}
                title={
                  sortField === 'businessName'
                    ? (sortDirection === 'asc' ? 'Sorted A-Z. Click for Z-A' : 'Sorted Z-A. Click to clear sort')
                    : 'Click to sort by Lead / Business Name'
                }
              >
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <span className={sortField === 'businessName' ? 'text-primary fw-bold' : ''}>Business Name</span>
                  {sortField === 'businessName' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} className="text-primary flex-shrink-0" />
                    ) : (
                      <ArrowDown size={13} className="text-primary flex-shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-muted opacity-50 flex-shrink-0" />
                  )}
                </div>
              </th>

              {/* Sortable Category Header */}
              <th 
                className="py-2 px-2.5 table-sort-header" 
                style={{ minWidth: '130px' }}
                onClick={() => handleSort('category')}
                title={
                  sortField === 'category'
                    ? (sortDirection === 'asc' ? 'Sorted A-Z. Click for Z-A' : 'Sorted Z-A. Click to clear sort')
                    : 'Click to sort by Category'
                }
              >
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <span className={sortField === 'category' ? 'text-primary fw-bold' : ''}>Category</span>
                  {sortField === 'category' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} className="text-primary flex-shrink-0" />
                    ) : (
                      <ArrowDown size={13} className="text-primary flex-shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-muted opacity-50 flex-shrink-0" />
                  )}
                </div>
              </th>

              {/* Source Column: Exact registry or platform where contact was found */}
              <th 
                className="py-2 px-2.5 table-sort-header" 
                style={{ minWidth: '125px' }}
                onClick={() => handleSort('source')}
                title={
                  sortField === 'source'
                    ? (sortDirection === 'desc' ? 'Sorted Z-A. Click to clear sort' : 'Sorted A-Z. Click to reverse')
                    : 'Click to sort by discovery source (Justdial, IndiaMART, Udyam MSME, MCA Registry, GeM, etc.)'
                }
              >
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <span className={sortField === 'source' ? 'text-primary fw-bold' : ''}>Source</span>
                  {sortField === 'source' ? (
                    sortDirection === 'desc' ? (
                      <ArrowDown size={13} className="text-primary flex-shrink-0" />
                    ) : (
                      <ArrowUp size={13} className="text-primary flex-shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-muted opacity-50 flex-shrink-0" />
                  )}
                </div>
              </th>

              {/* Sortable Data Integrity Header */}
              <th 
                className="py-2 px-2.5 table-sort-header" 
                style={{ minWidth: '135px' }}
                onClick={() => handleSort('integrity')}
                title={
                  sortField === 'integrity'
                    ? (sortDirection === 'desc' ? 'Sorted High to Low. Click for Low to High' : 'Sorted Low to High. Click to clear sort')
                    : 'Click to sort by Data Integrity Score (Phone, Email, Address)'
                }
              >
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <span className={sortField === 'integrity' ? 'text-primary fw-bold' : ''}>Data Integrity</span>
                  {sortField === 'integrity' ? (
                    sortDirection === 'desc' ? (
                      <ArrowDown size={13} className="text-primary flex-shrink-0" />
                    ) : (
                      <ArrowUp size={13} className="text-primary flex-shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-muted opacity-50 flex-shrink-0" />
                  )}
                </div>
              </th>

              <th className="py-2 px-2.5" style={{ minWidth: '200px' }}>Address</th>
              <th className="py-2 px-2.5" style={{ minWidth: '120px' }}>Location</th>
              <th className="py-2 px-2.5" style={{ minWidth: '90px' }}>Map View</th>
              <th className="py-2 px-2.5" style={{ minWidth: '130px' }}>Contact Number</th>
              <th className="py-2 px-2.5" style={{ minWidth: '130px' }}>Email</th>
              <th className="py-2 px-2.5" style={{ minWidth: '110px' }}>WhatsApp</th>
              <th className="py-2 px-2.5" style={{ minWidth: '170px' }}>Website &amp; Socials</th>
              <th className="py-2 px-2.5" style={{ minWidth: '120px' }}>Tag</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-5 text-center text-muted">
                  {leads.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-4">
                      <div 
                        className="rounded-circle p-3 mb-2.5 d-inline-flex align-items-center justify-content-center"
                        style={{ backgroundColor: '#E8F0FE', color: '#1A73E8' }}
                      >
                        <Upload size={24} />
                      </div>
                      <h6 className="fw-bold text-dark mb-1">No Leads Loaded in Step 2</h6>
                      <p className="small text-secondary mb-3" style={{ maxWidth: '440px' }}>
                        Import an existing spreadsheet (.xlsx, .csv, .json) with Place IDs, or search real commercial contacts above to populate your database.
                      </p>
                      {onOpenImportModal && (
                        <button
                          type="button"
                          onClick={onOpenImportModal}
                          className="btn btn-sm btn-g-blue text-white rounded-pill px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                        >
                          <Upload size={14} />
                          <span>Import Leads Spreadsheet</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    'No records match your filter.'
                  )}
                </td>
              </tr>
            ) : (
              sortedLeads.map((item, idx) => {
                const isSelected = selectedIds.has(item.id);
                const integrity = calculateDataIntegrity(item);
                const isGeminiLead = (item.source || '').toLowerCase().includes('gemini') || item.enrichedByGemini;
                return (
                  <tr 
                    key={item.id ? `${item.id}-${idx}` : `lead-row-${idx}`}
                    id={`lead-row-${item.id}`}
                    className={isSelected ? 'table-primary' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleRow(item.id)}
                  >
                    {/* Row Checkbox */}
                    <td 
                      className="px-2 text-center" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={isSelected}
                        onChange={() => handleToggleRow(item.id)}
                        style={{ cursor: 'pointer' }}
                        title="Select lead"
                      />
                    </td>

                    <td className="px-2 text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                      {idx + 1}
                    </td>

                    {/* Business Name */}
                    <td className="px-2.5">
                      <div className="fw-semibold text-dark">{item.businessName}</div>
                    </td>

                    {/* Category */}
                    <td className="px-2.5 text-nowrap">
                      <span className="badge bg-light text-secondary border fw-medium px-2 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                        {item.category || 'General'}
                      </span>
                    </td>

                    {/* Source: Showing the exact directory, registry, or platform origin badge */}
                    <td className="px-2.5 text-nowrap" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const specific = item.specificSource || item.source || '';
                        const sLower = specific.toLowerCase();
                        let sourceBadgeNode: React.ReactNode = null;

                        // 1. Justdial (JD Justdial badge in orange)
                        if (sLower.includes('justdial')) {
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5', fontSize: '0.72rem' }}
                              title="Discovered through Justdial local business directories (justdial.com)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>JD</span>
                              <span>Justdial</span>
                            </span>
                          );
                        } else if (sLower.includes('indiamart')) {
                          // 2. IndiaMART (IM IndiaMART badge in emerald green)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: '0.72rem' }}
                              title="Manufacturer, supplier, and B2B vendor catalog (indiamart.com)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>IM</span>
                              <span>IndiaMART</span>
                            </span>
                          );
                        } else if (sLower.includes('udyam') || sLower.includes('msme')) {
                          // 3. Udyam Registration Portal (udyamregistration.gov.in)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontSize: '0.72rem' }}
                              title="Official MSME profile and registration data (udyamregistration.gov.in)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>UD</span>
                              <span>Udyam MSME</span>
                            </span>
                          );
                        } else if (sLower.includes('gem') || sLower.includes('marketplace') || sLower.includes('e-marketplace')) {
                          // 4. Government e-Marketplace (GeM) (gem.gov.in)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.72rem' }}
                              title="National public procurement portal seller directory (gem.gov.in)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>GeM</span>
                              <span>GeM Portal</span>
                            </span>
                          );
                        } else if (sLower.includes('startup')) {
                          // 5. Startup India Portal (startupindia.gov.in)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3', fontSize: '0.72rem' }}
                              title="Official recognized startup ecosystem directory (startupindia.gov.in)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>SI</span>
                              <span>Startup India</span>
                            </span>
                          );
                        } else if (sLower.includes('gst')) {
                          // 6. GST Portal (gst.gov.in)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#F5F3FF', color: '#5B21B6', border: '1px solid #DDD6FE', fontSize: '0.72rem' }}
                              title="Official indirect tax & business GSTIN identification (gst.gov.in)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>GST</span>
                              <span>GST Portal</span>
                            </span>
                          );
                        } else if (sLower.includes('mca') || sLower.includes('roc') || sLower.includes('registry') || sLower.includes('ltd') || sLower.includes('llp')) {
                          // 7. MCA / ROC Registry (MCA Registry with building icon in purple)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#FAF5FF', color: '#6D28D9', border: '1px solid #E9D5FF', fontSize: '0.72rem' }}
                              title="Incorporated companies, LLPs, and Pvt Ltd entities verified against corporate registry (mca.gov.in)"
                            >
                              <Building2 size={11} className="text-purple-600 flex-shrink-0" />
                              <span>MCA Registry</span>
                            </span>
                          );
                        } else if (sLower.includes('tradeindia')) {
                          // 8. TradeIndia (TI TradeIndia badge in amber)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontSize: '0.72rem' }}
                              title="TradeIndia commercial & vendor records (tradeindia.com)"
                            >
                              <span className="fw-bold" style={{ fontSize: '0.68rem' }}>TI</span>
                              <span>TradeIndia</span>
                            </span>
                          );
                        } else if (sLower.includes('google') || sLower.includes('maps')) {
                          // 9. Google Maps (Google Maps with map pin in blue)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs"
                              style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.72rem' }}
                              title="Listings extracted from Google Maps"
                            >
                              <MapPin size={11} className="text-primary flex-shrink-0" />
                              <span>Google Maps</span>
                            </span>
                          );
                        } else if (sLower.includes('website') || (item.website && !item.website.includes('google.com'))) {
                          // 10. Official Website (Official Website with globe icon in forest green)
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontSize: '0.72rem' }}
                              title="Contacts identified directly from company web domains"
                            >
                              <Globe size={11} className="text-success flex-shrink-0" />
                              <span>Official Website</span>
                            </span>
                          );
                        } else {
                          // 11. General Verified Web Directory
                          sourceBadgeNode = (
                            <span 
                              className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold shadow-xs" 
                              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: '0.72rem' }}
                              title="Discovered across internet directories & commercial registries"
                            >
                              <Sparkles size={11} className="text-indigo-600 flex-shrink-0" />
                              <span>{specific || 'Web Directory'}</span>
                            </span>
                          );
                        }

                        return sourceBadgeNode;
                      })()}
                    </td>

                    {/* Data Integrity Score Badge */}
                    <td className="px-2.5 text-nowrap">
                      <div 
                        className="d-inline-flex align-items-center gap-1.5"
                        title={`Data Integrity: ${integrity.score}% (${integrity.itemsCount}/3 completeness)\n• Phone: ${integrity.hasPhone ? '✓ Available' : '✗ Missing'}\n• Email: ${integrity.hasEmail ? '✓ Available' : '✗ Missing'}\n• Address: ${integrity.hasAddress ? '✓ Available' : '✗ Missing'}`}
                      >
                        <span 
                          className={`badge ${integrity.badgeClass} rounded-pill px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {integrity.score === 100 && <ShieldCheck size={11} className="text-success" />}
                          {integrity.score === 67 && <Shield size={11} className="text-primary" />}
                          {integrity.score === 33 && <AlertTriangle size={11} style={{ color: 'var(--g-yellow-text)' }} />}
                          {integrity.score === 0 && <XCircle size={11} className="text-muted" />}
                          <span>{integrity.score}%</span>
                        </span>
                        <div 
                          className="d-inline-flex gap-0.5" 
                          title={`Completeness: Phone (${integrity.hasPhone ? '✓' : '✗'}), Email (${integrity.hasEmail ? '✓' : '✗'}), Address (${integrity.hasAddress ? '✓' : '✗'})`}
                        >
                          <span 
                            className={`rounded-circle d-inline-block ${integrity.hasPhone ? 'bg-success' : 'bg-secondary-subtle'}`} 
                            style={{ width: '5px', height: '5px' }} 
                          />
                          <span 
                            className={`rounded-circle d-inline-block ${integrity.hasEmail ? 'bg-success' : 'bg-secondary-subtle'}`} 
                            style={{ width: '5px', height: '5px' }} 
                          />
                          <span 
                            className={`rounded-circle d-inline-block ${integrity.hasAddress ? 'bg-success' : 'bg-secondary-subtle'}`} 
                            style={{ width: '5px', height: '5px' }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-2.5 text-truncate" style={{ maxWidth: '240px' }} title={item.address}>
                      {item.address}
                    </td>

                    {/* Location & Radius Distance */}
                    <td className="px-2.5 text-nowrap">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="text-secondary">{item.location}</span>
                        <span 
                          className="badge rounded-pill bg-light text-success border border-success-subtle d-inline-flex align-items-center gap-0.5 fw-semibold flex-shrink-0"
                          style={{ fontSize: '0.67rem', padding: '1px 6px' }}
                          title={`Within ${searchConfig?.radiusKm || 5} km radius limit`}
                        >
                          <MapPin size={9} className="text-success" />
                          <span>{item.distanceKm !== undefined ? `${item.distanceKm} km` : `≤${searchConfig?.radiusKm || 5}km`}</span>
                        </span>
                      </div>
                    </td>

                    {/* Map Link */}
                    <td className="px-2.5 text-nowrap" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        let url = (item.googleMapLocation || '').trim();
                        if (!url && item.lat && item.lng && Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
                          url = `https://maps.google.com/?q=${item.lat},${item.lng}`;
                        } else if (!url && item.address) {
                          url = `https://maps.google.com/?q=${encodeURIComponent(item.businessName + ', ' + item.address)}`;
                        }
                        const isValidMapLink = Boolean(
                          url &&
                          url.startsWith('http') &&
                          (url.includes('maps.google') || url.includes('goo.gl') || url.includes('google.com/maps'))
                        );

                        if (!isValidMapLink) {
                          return <span className="text-muted">—</span>;
                        }

                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-g-blue btn-sm py-0.5 px-2 d-inline-flex align-items-center gap-1 shadow-xs text-decoration-none"
                            style={{ fontSize: '0.72rem', fontWeight: 500 }}
                            title={`Open ${item.businessName} on Google Maps`}
                          >
                            <MapPin size={11} className="text-primary flex-shrink-0" />
                            <span>View Map</span>
                            <ExternalLink size={10} className="text-secondary" />
                          </a>
                        );
                      })()}
                    </td>

                    {/* Contact Number */}
                    <td className="px-2.5 text-nowrap font-monospace fw-semibold text-dark" onClick={(e) => e.stopPropagation()}>
                      {item.contactNumber ? (
                        <a href={`tel:${item.contactNumber}`} className="text-decoration-none text-dark d-flex align-items-center gap-1">
                          <Phone size={11} className="text-primary" />
                          <span>{item.contactNumber}</span>
                        </a>
                      ) : (
                        <span className="text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Not Listed</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-2.5 text-nowrap font-monospace text-secondary" style={{ fontSize: '0.72rem' }} onClick={(e) => e.stopPropagation()}>
                      {item.email ? (
                        <a href={`mailto:${item.email}`} className="text-decoration-none text-secondary d-flex align-items-center gap-1">
                          <Mail size={11} className="text-muted" />
                          <span>{item.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* WhatsApp */}
                    <td className="px-2.5 text-nowrap" onClick={(e) => e.stopPropagation()}>
                      {item.whatsappNo ? (
                        <a
                          href={`https://wa.me/${item.whatsappNo.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-g-green text-decoration-none d-inline-flex align-items-center gap-1 py-1 px-2 font-monospace"
                          style={{ fontSize: '0.7rem' }}
                        >
                          <MessageSquare size={10} className="text-success" />
                          <span>{item.whatsappNo}</span>
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Website & Social Media Profiles */}
                    <td className="px-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex flex-column gap-1">
                        {item.website && !item.website.includes('maps.google.com') ? (
                          <div className="d-flex align-items-center gap-1">
                            <a
                              href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-decoration-none d-inline-flex align-items-center gap-1 text-truncate"
                              style={{ maxWidth: '140px', fontSize: '0.72rem' }}
                              title={item.website}
                            >
                              <Globe size={11} className="flex-shrink-0 text-primary" />
                              <span className="text-truncate">{item.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                              <ExternalLink size={9} className="flex-shrink-0" />
                            </a>
                            {item.enrichedByGemini && (
                              <span 
                                className="badge bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded-pill font-semibold" 
                                style={{ fontSize: '0.6rem' }} 
                                title="Enriched by Gemini AI"
                              >
                                AI
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small" style={{ fontSize: '0.7rem' }}>—</span>
                        )}

                        {/* Discovered Social Media & eCommerce Seller Profiles - Show ONLY icons where an actual, verified account/storefront URL was found */}
                        {item.socialProfiles && (
                          <div className="d-flex align-items-center gap-1 flex-wrap pt-0.5">
                            {/* LinkedIn Company or Profile */}
                            {isAuthenticPlatformProfileUrl('linkedin', item.socialProfiles.linkedin) && (
                              <a
                                href={item.socialProfiles.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#0A66C2', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified LinkedIn Account: ${item.socialProfiles.linkedin}`}
                              >
                                <span className="fw-bold">in</span>
                              </a>
                            )}
                            {/* Instagram Profile */}
                            {isAuthenticPlatformProfileUrl('instagram', item.socialProfiles.instagram) && (
                              <a
                                href={item.socialProfiles.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Instagram Account: ${item.socialProfiles.instagram}`}
                              >
                                <span className="fw-bold">IG</span>
                              </a>
                            )}
                            {/* Facebook Business Page */}
                            {isAuthenticPlatformProfileUrl('facebook', item.socialProfiles.facebook) && (
                              <a
                                href={item.socialProfiles.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#1877F2', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Facebook Page: ${item.socialProfiles.facebook}`}
                              >
                                <span className="fw-bold">FB</span>
                              </a>
                            )}
                            {/* X / Twitter Profile */}
                            {isAuthenticPlatformProfileUrl('twitter', item.socialProfiles.twitter) && (
                              <a
                                href={item.socialProfiles.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#0F1419', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified X/Twitter Account: ${item.socialProfiles.twitter}`}
                              >
                                <span className="fw-bold">X</span>
                              </a>
                            )}
                            {/* YouTube Channel */}
                            {isAuthenticPlatformProfileUrl('youtube', item.socialProfiles.youtube) && (
                              <a
                                href={item.socialProfiles.youtube}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#FF0000', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified YouTube Channel: ${item.socialProfiles.youtube}`}
                              >
                                <span className="fw-bold">YT</span>
                              </a>
                            )}
                            {/* IndiaMART Seller Catalog */}
                            {isAuthenticPlatformProfileUrl('indiamart', item.socialProfiles.indiamart) && (
                              <a
                                href={item.socialProfiles.indiamart}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#2E3192', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified IndiaMART Seller Store: ${item.socialProfiles.indiamart}`}
                              >
                                <span className="fw-bold">IM</span>
                              </a>
                            )}
                            {/* Justdial Business Profile */}
                            {isAuthenticPlatformProfileUrl('justdial', item.socialProfiles.justdial) && (
                              <a
                                href={item.socialProfiles.justdial}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#FF7A00', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Justdial Listing: ${item.socialProfiles.justdial}`}
                              >
                                <span className="fw-bold">JD</span>
                              </a>
                            )}
                            {/* TradeIndia Seller Listing */}
                            {isAuthenticPlatformProfileUrl('tradeindia', item.socialProfiles.tradeindia) && (
                              <a
                                href={item.socialProfiles.tradeindia}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#0083CA', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified TradeIndia Seller: ${item.socialProfiles.tradeindia}`}
                              >
                                <span className="fw-bold">TI</span>
                              </a>
                            )}
                            {/* Amazon Seller / Storefront */}
                            {isAuthenticPlatformProfileUrl('amazon', item.socialProfiles.amazon) && (
                              <a
                                href={item.socialProfiles.amazon}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-dark text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#FF9900', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Amazon Seller Store: ${item.socialProfiles.amazon}`}
                              >
                                <span className="fw-bold">Amazon</span>
                              </a>
                            )}
                            {/* Flipkart Seller / Storefront */}
                            {isAuthenticPlatformProfileUrl('flipkart', item.socialProfiles.flipkart) && (
                              <a
                                href={item.socialProfiles.flipkart}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#2874F0', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Flipkart Seller Store: ${item.socialProfiles.flipkart}`}
                              >
                                <span className="fw-bold">Flipkart</span>
                              </a>
                            )}
                            {/* Meesho Seller / Storefront */}
                            {isAuthenticPlatformProfileUrl('meesho', item.socialProfiles.meesho) && (
                              <a
                                href={item.socialProfiles.meesho}
                                target="_blank"
                                rel="noreferrer"
                                className="badge text-white text-decoration-none px-1.5 py-0.5 rounded shadow-xs d-inline-flex align-items-center gap-0.5 transition-all"
                                style={{ backgroundColor: '#9B2063', fontSize: '0.62rem', letterSpacing: '0.2px' }}
                                title={`Verified Meesho Seller Store: ${item.socialProfiles.meesho}`}
                              >
                                <span className="fw-bold">Meesho</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tag Field in Table */}
                    <td className="px-2.5 text-nowrap">
                      {(item.tag || item.note) ? (
                        <span className="badge badge-g-yellow font-monospace px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>
                          <Tag size={10} className="me-1 inline" style={{ color: 'var(--g-yellow-text)' }} />
                          {item.tag || item.note}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Interactive Geographic Map View for all discovered contacts */}
    {leads.length > 0 && (
      <ContactsMapView
        leads={leads}
        searchConfig={searchConfig}
        selectedCategory={selectedCategoryTab}
        onSelectLead={(id) => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
          const el = document.getElementById(`lead-row-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />
    )}

    {/* Duplicate Validation & Audit Details Modal */}
    <DuplicateValidationModal
      isOpen={isAuditModalOpen}
      onClose={() => setIsAuditModalOpen(false)}
      auditResult={auditResult}
    />
  </>
  );
};
