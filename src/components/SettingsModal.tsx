import React, { useState, useEffect } from 'react';
import { X, Settings, Sparkles, Check, Sliders, Bell, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { AppSettings, getStoredSettings, saveStoredSettings } from '../utils/userProfile';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredSettings());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = saveStoredSettings(settings);
    if (onSettingsUpdated) {
      onSettingsUpdated(updated);
    }
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    const defaultVals: AppSettings = {
      defaultRadiusKm: 5,
      autoEnrichWithAi: true,
      exportFormat: 'xlsx',
      notificationsEnabled: true
    };
    setSettings(defaultVals);
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white shadow-xs flex-shrink-0"
                style={{ width: '36px', height: '36px' }}
              >
                <Settings size={18} />
              </div>
              <div>
                <h6 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1rem', letterSpacing: '-0.2px' }}>
                  Application Settings
                </h6>
                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                  Configure extraction pipeline, defaults & export preferences
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-light border-0 rounded-circle d-flex align-items-center justify-content-center text-muted"
              style={{ width: '32px', height: '32px' }}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            <div className="d-flex flex-column gap-3">
              
              {/* Default Search Radius */}
              <div className="bg-white p-3 rounded-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Sliders size={16} className="text-primary" />
                    <span className="fw-semibold text-dark small" style={{ fontSize: '0.82rem' }}>
                      Default Search Radius
                    </span>
                  </div>
                  <span className="badge badge-g-blue rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                    {settings.defaultRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={settings.defaultRadiusKm}
                  onChange={(e) => setSettings((p) => ({ ...p, defaultRadiusKm: Number(e.target.value) }))}
                  className="form-range"
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem' }}>
                  <span>1 km (Local Area)</span>
                  <span>25 km</span>
                  <span>50 km (Metro Zone)</span>
                </div>
              </div>

              {/* Gemini AI Auto-Enrichment */}
              <div className="bg-white p-3 rounded-3 border d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-start gap-2.5 pe-3">
                  <Sparkles size={18} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="fw-semibold text-dark small" style={{ fontSize: '0.82rem' }}>
                      Gemini Contact Intelligence
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                      Automatically verify social profiles, domains, emails and clean business names
                    </div>
                  </div>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    role="switch"
                    checked={settings.autoEnrichWithAi}
                    onChange={(e) => setSettings((p) => ({ ...p, autoEnrichWithAi: e.target.checked }))}
                    style={{ width: '38px', height: '20px' }}
                  />
                </div>
              </div>

              {/* Preferred Export Format */}
              <div className="bg-white p-3 rounded-3 border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FileSpreadsheet size={16} className="text-success" />
                  <span className="fw-semibold text-dark small" style={{ fontSize: '0.82rem' }}>
                    Default Export Format
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, exportFormat: 'xlsx' }))}
                    className={`btn btn-sm flex-grow-1 rounded-pill fw-semibold py-1.5 ${
                      settings.exportFormat === 'xlsx'
                        ? 'btn-g-blue text-white shadow-xs'
                        : 'btn-light border text-secondary'
                    }`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Excel Workbook (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, exportFormat: 'vcf' }))}
                    className={`btn btn-sm flex-grow-1 rounded-pill fw-semibold py-1.5 ${
                      settings.exportFormat === 'vcf'
                        ? 'btn-g-red text-white shadow-xs'
                        : 'btn-light border text-secondary'
                    }`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Google Pixel VCF (.vcf)
                  </button>
                </div>
              </div>

              {/* In-App Alerts & Sound */}
              <div className="bg-white p-3 rounded-3 border d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-start gap-2.5 pe-3">
                  <Bell size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="fw-semibold text-dark small" style={{ fontSize: '0.82rem' }}>
                      Completion Toast Notifications
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                      Show floating notifications when extraction or enrichments finish
                    </div>
                  </div>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    role="switch"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, notificationsEnabled: e.target.checked }))}
                    style={{ width: '38px', height: '20px' }}
                  />
                </div>
              </div>

            </div>

            {isSaved && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 rounded-3 mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
                <Check size={16} className="text-success flex-shrink-0" />
                <span>Settings preferences updated!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white border-top py-2.5 px-4 d-flex align-items-center justify-content-between">
            <button
              type="button"
              className="btn btn-sm btn-link text-muted text-decoration-none d-inline-flex align-items-center gap-1.5 p-0"
              onClick={handleResetDefaults}
              style={{ fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-light border px-3 rounded-pill fw-semibold"
                onClick={onClose}
                style={{ fontSize: '0.82rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaved}
                className="btn btn-sm btn-g-blue text-white px-3.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                style={{ fontSize: '0.82rem' }}
              >
                <Check size={14} />
                <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
