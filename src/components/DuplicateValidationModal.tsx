import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2, 
  ArrowRight, 
  Copy, 
  MapPin, 
  Phone, 
  Tag, 
  Search,
  ExternalLink
} from 'lucide-react';
import { ValidationAuditResult, DuplicateRecordDetail } from '../utils/duplicateAudit';

interface DuplicateValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: ValidationAuditResult | null;
}

export const DuplicateValidationModal: React.FC<DuplicateValidationModalProps> = ({
  isOpen,
  onClose,
  auditResult
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen || !auditResult) return null;

  const { totalChecked, uniqueCount, duplicateCount, duplicates } = auditResult;

  const filteredDuplicates = duplicates.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.duplicateLead.businessName?.toLowerCase().includes(q) ||
      item.duplicateLead.address?.toLowerCase().includes(q) ||
      item.duplicateLead.contactNumber?.includes(q) ||
      item.matchValue?.toLowerCase().includes(q)
    );
  });

  const getMatchBadge = (detail: DuplicateRecordDetail) => {
    switch (detail.matchField) {
      case 'placeId':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 small fw-semibold">
            Duplicate Place ID: {detail.matchValue}
          </span>
        );
      case 'phone':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 small fw-semibold">
            Duplicate Phone: {detail.matchValue}
          </span>
        );
      case 'businessName':
      default:
        return (
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 small fw-semibold">
            Duplicate Name: "{detail.matchValue}"
          </span>
        );
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 1070 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="modal-header border-bottom border-slate-100 py-3 px-4 bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle p-2"
                style={{ 
                  backgroundColor: duplicateCount > 0 ? '#FEF3C7' : '#E6F4EA', 
                  color: duplicateCount > 0 ? '#D97706' : '#137333' 
                }}
              >
                {duplicateCount > 0 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div>
                <h6 className="modal-title fw-bold text-dark mb-0 fs-6">
                  Table Data Validation &amp; Duplicate Audit
                </h6>
                <div className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                  Auditing Step 2 records across Google Place IDs, Business Names, and Phone Numbers
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
          <div className="modal-body p-4 bg-light overflow-y-auto">
            {/* KPI Summary Cards */}
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="p-3 bg-white border border-slate-200 rounded-3 text-center shadow-2xs">
                  <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Total Checked
                  </div>
                  <div className="fs-4 fw-bold text-dark">
                    {totalChecked}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    Records analyzed
                  </div>
                </div>
              </div>

              <div className="col-4">
                <div className="p-3 bg-white border border-slate-200 rounded-3 text-center shadow-2xs">
                  <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Duplicates Cleaned
                  </div>
                  <div className={`fs-4 fw-bold ${duplicateCount > 0 ? 'text-danger' : 'text-success'}`}>
                    {duplicateCount}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {duplicateCount > 0 ? 'Removed from table' : 'Zero duplicates'}
                  </div>
                </div>
              </div>

              <div className="col-4">
                <div className="p-3 bg-white border border-slate-200 rounded-3 text-center shadow-2xs">
                  <div className="text-secondary small fw-medium mb-0.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Final Unique
                  </div>
                  <div className="fs-4 fw-bold text-primary">
                    {uniqueCount}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    100% unique leads
                  </div>
                </div>
              </div>
            </div>

            {/* Status Feedback Banner */}
            {duplicateCount === 0 ? (
              <div
                className="p-3 rounded-3 d-flex align-items-start gap-2.5 mb-3"
                style={{ backgroundColor: '#E6F4EA', border: '1px solid #CEEAD6', color: '#137333' }}
              >
                <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <div className="fw-bold small mb-0.5" style={{ fontSize: '0.86rem' }}>
                    Database is 100% Unique &amp; Verified!
                  </div>
                  <div className="small opacity-90" style={{ fontSize: '0.76rem' }}>
                    No duplicate records detected. All {totalChecked} commercial listings have distinctive Google Place IDs, business names, and authentic phone numbers.
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-3 rounded-3 d-flex align-items-start gap-2.5 mb-3"
                style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}
              >
                <Trash2 size={18} className="text-warning-emphasis flex-shrink-0 mt-0.5" />
                <div>
                  <div className="fw-bold small mb-0.5" style={{ fontSize: '0.86rem' }}>
                    Cleaned {duplicateCount} Duplicate {duplicateCount === 1 ? 'Record' : 'Records'}
                  </div>
                  <div className="small opacity-90" style={{ fontSize: '0.76rem' }}>
                    We automatically preserved the primary record with complete contact data and removed the redundant duplicate occurrences from your active Step 2 table.
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Records List Section */}
            {duplicateCount > 0 && (
              <div className="d-flex flex-column gap-2.5">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                  <span className="fw-bold text-dark small">
                    Removed Duplicate Records ({duplicateCount})
                  </span>

                  {duplicates.length > 3 && (
                    <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                      <span className="input-group-text bg-white border-end-0">
                        <Search size={12} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder="Search duplicates..."
                        className="form-control border-start-0"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>
                  )}
                </div>

                <div className="d-flex flex-column gap-2.5" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {filteredDuplicates.map((detail, idx) => {
                    const dup = detail.duplicateLead;
                    const orig = detail.originalLead;
                    return (
                      <div
                        key={`dup-item-${dup.id || idx}`}
                        className="p-3 bg-white border border-slate-200 rounded-3 shadow-2xs"
                      >
                        {/* Match Reason Header */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-slate-100">
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="badge bg-danger text-white rounded-pill px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              Removed #{idx + 1}
                            </span>
                            {getMatchBadge(detail)}
                          </div>
                          {dup.category && (
                            <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              {dup.category}
                            </span>
                          )}
                        </div>

                        {/* Side by side or detailed breakdown */}
                        <div className="row g-2">
                          {/* Removed Duplicate Details */}
                          <div className="col-12 col-md-6 border-end-md border-slate-100">
                            <div className="text-danger small fw-bold mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.74rem' }}>
                              <Trash2 size={12} />
                              <span>Removed Duplicate</span>
                            </div>
                            <div className="fw-bold text-dark small mb-0.5">
                              {dup.businessName}
                            </div>
                            <div className="text-secondary small d-flex align-items-center gap-1 mb-0.5" style={{ fontSize: '0.72rem' }}>
                              <MapPin size={11} className="flex-shrink-0 text-muted" />
                              <span className="text-truncate">{dup.address || dup.location || 'No address specified'}</span>
                            </div>
                            {dup.contactNumber && (
                              <div className="text-secondary small d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                <Phone size={11} className="flex-shrink-0 text-muted" />
                                <span>{dup.contactNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* Preserved Original Record Details */}
                          <div className="col-12 col-md-6">
                            <div className="text-success small fw-bold mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.74rem' }}>
                              <CheckCircle2 size={12} />
                              <span>Preserved Primary Record</span>
                            </div>
                            <div className="fw-bold text-dark small mb-0.5">
                              {orig.businessName}
                            </div>
                            <div className="text-secondary small d-flex align-items-center gap-1 mb-0.5" style={{ fontSize: '0.72rem' }}>
                              <MapPin size={11} className="flex-shrink-0 text-muted" />
                              <span className="text-truncate">{orig.address || orig.location || 'No address specified'}</span>
                            </div>
                            {orig.contactNumber && (
                              <div className="text-secondary small d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                <Phone size={11} className="flex-shrink-0 text-muted" />
                                <span>{orig.contactNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-slate-100 py-2.5 px-4 bg-white d-flex align-items-center justify-content-between">
            <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
              {duplicateCount > 0 ? (
                <span>Step 2 table updated: <strong>{uniqueCount} unique records</strong></span>
              ) : (
                <span>All <strong>{totalChecked} records</strong> are verified unique</span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-g-blue text-white fw-semibold px-4 py-1.5 rounded-pill shadow-sm"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
