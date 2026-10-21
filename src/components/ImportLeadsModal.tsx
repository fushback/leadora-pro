import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Database
} from 'lucide-react';
import { LeadItem } from '../types';
import { parseLeadsFromFile, ImportSummary } from '../utils/importLeads';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (
    importedLeads: LeadItem[],
    importMode: 'replace' | 'merge',
    detectedLocation?: string,
    detectedCategories?: string[]
  ) => void;
  currentLeadsCount: number;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  currentLeadsCount
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [syncLocation, setSyncLocation] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setIsParsing(true);
    try {
      const result = await parseLeadsFromFile(file);
      if (result.validLeads.length === 0) {
        throw new Error('No valid business leads found in this file. Please ensure it contains Business Name columns.');
      }
      setSummary(result);
    } catch (err: any) {
      setError(err.message || 'Failed to read file. Please ensure it is a valid .xlsx, .csv, or .json file.');
      setSummary(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (!summary || summary.validLeads.length === 0) return;
    onImportComplete(
      summary.validLeads,
      importMode,
      syncLocation ? summary.detectedLocation : undefined,
      summary.detectedCategories
    );
    onClose();
  };

  const resetSelection = () => {
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
        >
          {/* Header */}
          <div className="modal-header border-bottom border-slate-100 py-3 px-4 bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle p-2"
                style={{ backgroundColor: '#E8F0FE', color: '#1A73E8' }}
              >
                <Upload size={18} />
              </div>
              <div>
                <h6 className="modal-title fw-bold text-dark mb-0 fs-6">
                  Import B2B Leads Spreadsheet
                </h6>
                <div className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                  Load an existing Excel (.xlsx, .xls), CSV, or JSON database into Step 2
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-close shadow-none"
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            {!summary ? (
              /* Dropzone view */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all bg-white ${
                  isDragging ? 'border-primary bg-primary-subtle' : 'border-slate-300 hover-border-primary'
                }`}
                style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .json"
                  className="d-none"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                {isParsing ? (
                  <div className="d-flex flex-column align-items-center gap-2 py-4">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <span className="fw-semibold text-dark small">Analyzing spreadsheet and extracting Place IDs...</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="rounded-circle p-3 mb-2.5 d-inline-flex align-items-center justify-content-center shadow-2xs"
                      style={{ backgroundColor: '#F1F5F9', color: '#1A73E8' }}
                    >
                      <FileSpreadsheet size={28} />
                    </div>
                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                      Click to browse or drag &amp; drop your leads spreadsheet here
                    </div>
                    <div className="text-secondary small mb-3" style={{ fontSize: '0.76rem' }}>
                      Supports Excel (<strong>.xlsx</strong>, <strong>.xls</strong>), <strong>.csv</strong>, and <strong>.json</strong> files
                    </div>
                    <div
                      className="badge rounded-pill fw-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <ShieldCheck size={12} className="text-primary me-1 d-inline" />
                      Place IDs are extracted automatically to ensure 100% duplicate-free future re-searches
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Parsed Preview View */
              <div className="d-flex flex-column gap-3">
                {/* File summary pill */}
                <div className="d-flex align-items-center justify-content-between p-2.5 bg-white border border-slate-200 rounded-3">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <FileSpreadsheet size={20} className="text-success flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="fw-bold text-dark text-truncate small" style={{ fontSize: '0.84rem' }}>
                        {summary.fileName}
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                        {(summary.fileSize / 1024).toFixed(1)} KB · {summary.totalRows} Total Rows
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="btn btn-sm btn-outline-secondary py-1 px-2.5 rounded-pill"
                    style={{ fontSize: '0.74rem' }}
                  >
                    Change File
                  </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="row g-2">
                  <div className="col-12 col-sm-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-3 text-center">
                      <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Valid Leads
                      </div>
                      <div className="fs-4 fw-bold text-primary">
                        {summary.validLeads.length}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        Ready to load into table
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-3 text-center">
                      <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Unique Place IDs
                      </div>
                      <div className="fs-4 fw-bold text-success">
                        {summary.hasPlaceIdsCount}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {Math.round((summary.hasPlaceIdsCount / summary.validLeads.length) * 100)}% Verified Identifiers
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-3 text-center">
                      <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Categories
                      </div>
                      <div className="fs-4 fw-bold text-dark">
                        {summary.detectedCategories.length}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        Commercial sectors found
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duplicate-Free Guarantee Notice */}
                <div
                  className="p-2.5 rounded-3 d-flex align-items-center gap-2"
                  style={{ backgroundColor: '#E6F4EA', border: '1px solid #CEEAD6', color: '#137333', fontSize: '0.78rem' }}
                >
                  <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                  <span>
                    <strong>Duplicate-Free Continuous Search Ready:</strong> All {summary.validLeads.length} leads have persistent identifiers. Clicking "Search More" in Step 2 will query Google Maps &amp; Gemini AI while skipping every business in this imported list.
                  </span>
                </div>

                {/* Detected Location & Categories Preview */}
                <div className="p-3 bg-white border border-slate-200 rounded-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <span className="fw-bold text-dark small">Detected File Metadata</span>
                    {summary.detectedLocation && (
                      <span className="d-inline-flex align-items-center gap-1 text-primary fw-semibold small">
                        <MapPin size={12} />
                        <span>{summary.detectedLocation}</span>
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    {summary.detectedCategories.slice(0, 6).map((cat, idx) => (
                      <span
                        key={`det-cat-${idx}`}
                        className="badge bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-1 fw-medium"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {cat}
                      </span>
                    ))}
                    {summary.detectedCategories.length > 6 && (
                      <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                        +{summary.detectedCategories.length - 6} more
                      </span>
                    )}
                  </div>

                  {summary.detectedLocation && (
                    <div className="form-check mt-2 pt-2 border-top border-slate-100">
                      <input
                        type="checkbox"
                        id="syncLocationCheck"
                        className="form-check-input"
                        checked={syncLocation}
                        onChange={(e) => setSyncLocation(e.target.checked)}
                      />
                      <label htmlFor="syncLocationCheck" className="form-check-label text-secondary small" style={{ fontSize: '0.76rem', cursor: 'pointer' }}>
                        Set active search location to <strong>"{summary.detectedLocation}"</strong> for subsequent batches
                      </label>
                    </div>
                  )}
                </div>

                {/* Import Mode Selection */}
                {currentLeadsCount > 0 && (
                  <div className="p-3 bg-white border border-slate-200 rounded-3">
                    <div className="fw-bold text-dark small mb-2">Import Strategy</div>
                    <div className="d-flex flex-column gap-2">
                      <label
                        className={`d-flex align-items-center justify-content-between p-2 rounded-2 border cursor-pointer transition-all ${
                          importMode === 'merge' ? 'border-primary bg-primary-subtle text-dark' : 'border-slate-200 bg-white text-secondary'
                        }`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="form-check-input"
                          />
                          <span>
                            <strong>Add to Current List (Recommended)</strong> (Adds all {summary.validLeads.length} leads to existing {currentLeadsCount} leads, checking for any duplicates)
                          </span>
                        </div>
                      </label>

                      <label
                        className={`d-flex align-items-center justify-content-between p-2 rounded-2 border cursor-pointer transition-all ${
                          importMode === 'replace' ? 'border-primary bg-primary-subtle text-dark' : 'border-slate-200 bg-white text-secondary'
                        }`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="form-check-input"
                          />
                          <span>
                            <strong>Replace Active List</strong> (Clear current {currentLeadsCount} leads and start fresh with {summary.validLeads.length} imported leads)
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error notice */}
            {error && (
              <div className="alert alert-danger py-2 px-3 mt-3 mb-0 rounded-3 d-flex align-items-center gap-2 border-0" style={{ fontSize: '0.8rem' }}>
                <AlertCircle size={15} className="text-danger flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-slate-100 py-2.5 px-4 bg-white d-flex align-items-center justify-content-between">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-light border px-3 rounded-pill text-secondary"
            >
              Cancel
            </button>

            {summary && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="btn btn-sm btn-g-blue d-flex align-items-center gap-1.5 px-4 py-1.5 rounded-pill shadow-sm text-white fw-semibold"
              >
                <span>
                  {importMode === 'merge' && currentLeadsCount > 0 
                    ? `Add ${summary.validLeads.length} Leads to Table` 
                    : `Import ${summary.validLeads.length} Leads to Step 2`}
                </span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
