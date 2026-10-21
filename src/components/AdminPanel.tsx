import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Server, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  RefreshCw, 
  Save, 
  Sparkles, 
  Activity,
  Layers,
  Database,
  Globe2,
  HardDrive
} from 'lucide-react';
import { 
  SystemStatusType, 
  SystemStatusConfig, 
  STATUS_OPTIONS, 
  saveStoredSystemStatus 
} from '../utils/systemStatus';

interface AdminPanelProps {
  systemStatusConfig: SystemStatusConfig;
  onUpdateSystemStatus: (config: SystemStatusConfig) => void;
  onNavigateBack: () => void;
  onToast: (toast: { type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string }) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  systemStatusConfig,
  onUpdateSystemStatus,
  onNavigateBack,
  onToast
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SystemStatusType>(systemStatusConfig.status);
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    systemStatusConfig.broadcastNotice || 'System is fully operational. All Google Places & Gemini engines ready.'
  );
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<string>(
    systemStatusConfig.maintenanceSchedule || 'Sunday 02:00 - 03:00 UTC (Optional)'
  );
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: string }>>([
    {
      time: 'Just now',
      text: `Current status is ${STATUS_OPTIONS[systemStatusConfig.status].label}`,
      type: 'info'
    },
    {
      time: '10 mins ago',
      text: 'Gemini 2.5 Flash API health check passed (340ms latency)',
      type: 'success'
    },
    {
      time: '1 hour ago',
      text: 'System telemetry initialized on port 3000',
      type: 'info'
    }
  ]);

  const handleApplyStatus = (statusType: SystemStatusType) => {
    setSelectedStatus(statusType);
    const updatedConfig: SystemStatusConfig = {
      ...systemStatusConfig,
      status: statusType,
      broadcastNotice: broadcastMessage,
      maintenanceSchedule: maintenanceSchedule,
      updatedAt: new Date().toISOString(),
      lastChangedBy: 'Admin (Ashis Mehta)'
    };
    onUpdateSystemStatus(updatedConfig);
    saveStoredSystemStatus(updatedConfig);

    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: `System status switched to: ${STATUS_OPTIONS[statusType].label}. ${STATUS_OPTIONS[statusType].detail}`,
        type: statusType === 'active' ? 'success' : statusType === 'inactive' ? 'danger' : 'warning'
      },
      ...prev.slice(0, 7)
    ]);

    onToast({
      type: 'success',
      title: 'Status Updated',
      message: `${STATUS_OPTIONS[statusType].label} is now live! The ${statusType === 'active' ? 'green' : statusType === 'inactive' ? 'red' : statusType === 'on_hold' ? 'yellow' : 'blue'} dot is now blinking in the logo.`
    });
  };

  const handleSaveDetails = () => {
    const updatedConfig: SystemStatusConfig = {
      ...systemStatusConfig,
      status: selectedStatus,
      broadcastNotice: broadcastMessage,
      maintenanceSchedule: maintenanceSchedule,
      updatedAt: new Date().toISOString()
    };
    onUpdateSystemStatus(updatedConfig);
    saveStoredSystemStatus(updatedConfig);

    onToast({
      type: 'success',
      title: 'Admin Settings Saved',
      message: 'System notices and telemetry configurations have been saved successfully.'
    });
  };

  const activeMeta = STATUS_OPTIONS[selectedStatus];

  return (
    <div className="admin-panel-container py-2 py-md-3">
      {/* Top Navigation Bar & Breadcrumb */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateBack}
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 rounded-pill px-3 shadow-xs"
            title="Return to Lead Extraction Workflow"
          >
            <ArrowLeft size={15} />
            <span className="fw-semibold">Back to Lead Finder</span>
          </button>
          
          <div className="vr d-none d-sm-block text-muted" style={{ height: '24px' }} />

          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="h4 mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ letterSpacing: '-0.3px' }}>
                <Cpu size={22} className="text-primary" />
                Admin Panel
              </h1>
              <span className={`badge ${activeMeta.badgeClass} rounded-pill font-monospace`} style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
                {activeMeta.label.toUpperCase()}
              </span>
            </div>
            <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
              System status management, LED logo blinks, and runtime telemetry
            </p>
          </div>
        </div>

        {/* Quick Save / Status Badge */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDetails}
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 rounded-pill px-3 shadow-xs"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Status Selector & Live Preview */}
      <div className="row g-4 mb-4">
        
        {/* Left Column: 4 Status Controls */}
        <div className="col-12 col-lg-8">
          <div className="g-card p-3 p-sm-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <h2 className="h6 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                  <Activity size={18} className="text-primary" />
                  System Status &amp; Logo Indicator
                </h2>
                <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                  Select the current system state. The designated color dot in the 4-dot logo will blink continuously.
                </p>
              </div>
              <span className="badge bg-light text-muted border font-monospace small px-2 py-1">
                4-State Controller
              </span>
            </div>

            {/* 4 Status Cards */}
            <div className="row g-3">
              {(Object.keys(STATUS_OPTIONS) as SystemStatusType[]).map((key) => {
                const opt = STATUS_OPTIONS[key];
                const isSelected = selectedStatus === key;

                return (
                  <div key={key} className="col-12 col-sm-6">
                    <div 
                      onClick={() => handleApplyStatus(key)}
                      className={`card h-100 cursor-pointer border transition-all p-3 rounded-3 position-relative ${
                        isSelected 
                          ? 'border-2 shadow-sm' 
                          : 'border-light-subtle hover-bg-light'
                      }`}
                      style={{
                        cursor: 'pointer',
                        borderColor: isSelected ? opt.dotColor : 'var(--bs-border-color)',
                        backgroundColor: isSelected ? '#ffffff' : '#fafafa',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Active Selection Checkmark / Indicator */}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          {/* Animated Dot indicator */}
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              backgroundColor: opt.badgeBg, 
                              border: `1.5px solid ${opt.dotColor}` 
                            }}
                          >
                            <span 
                              className={`rounded-circle ${isSelected ? opt.blinkClass : ''}`}
                              style={{ 
                                width: '9px', 
                                height: '9px', 
                                backgroundColor: opt.dotColor,
                                display: 'block'
                              }} 
                            />
                          </div>

                          <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                            {opt.label}
                          </span>
                        </div>

                        {isSelected ? (
                          <span 
                            className="badge rounded-pill fw-semibold text-white px-2 py-1"
                            style={{ backgroundColor: opt.dotColor, fontSize: '0.68rem' }}
                          >
                            Blinking Now
                          </span>
                        ) : (
                          <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            Click to activate
                          </span>
                        )}
                      </div>

                      <p className="text-muted small mb-2" style={{ fontSize: '0.8rem', minHeight: '36px' }}>
                        {opt.description}
                      </p>

                      <div 
                        className="rounded-2 p-2 mt-auto border"
                        style={{ 
                          backgroundColor: opt.badgeBg,
                          fontSize: '0.74rem',
                          borderColor: `${opt.dotColor}33`
                        }}
                      >
                        <div className="d-flex align-items-center gap-1.5" style={{ color: opt.dotColor }}>
                          <span className="fw-bold">Logo Effect:</span>
                          <span className="text-dark">{opt.detail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Broadcast Notice Input */}
            <div className="mt-4 pt-3 border-top">
              <label className="form-label fw-semibold text-dark small mb-1 d-flex align-items-center justify-content-between">
                <span>System Broadcast Message</span>
                <span className="text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Visible in alerts &amp; status logs</span>
              </label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. System is active. All services running smoothly."
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="btn btn-outline-primary"
                >
                  Update Notice
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Logo Telemetry & Preview Box */}
        <div className="col-12 col-lg-4">
          <div className="g-card p-3 p-sm-4 h-100 d-flex flex-column">
            <h3 className="h6 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <Radio size={18} className="text-primary" />
              Live Logo Preview
            </h3>
            <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
              Real-time visualization of the 4-color dots in the brand logo
            </p>

            {/* Live Logo Box */}
            <div 
              className="bg-light rounded-3 border p-4 text-center my-auto d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: '180px' }}
            >
              <div className="mb-3">
                {/* Scaled-up preview of the 4-dot mark */}
                <div 
                  className="p-3 bg-white rounded-3 shadow-xs border d-inline-flex align-items-center justify-content-center"
                  style={{ width: '80px', height: '80px' }}
                >
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 18px)',
                      gap: '8px',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Blue Dot (Upgradation) */}
                    <span 
                      className={`dot-blue ${selectedStatus === 'upgradation' ? 'dot-blinking-blue' : ''}`}
                      style={{ width: '18px', height: '18px' }}
                      title="Blue: System Upgradation"
                    />
                    {/* Red Dot (Inactive) */}
                    <span 
                      className={`dot-red ${selectedStatus === 'inactive' ? 'dot-blinking-red' : ''}`}
                      style={{ width: '18px', height: '18px' }}
                      title="Red: System Inactive"
                    />
                    {/* Yellow Dot (On Hold) */}
                    <span 
                      className={`dot-yellow ${selectedStatus === 'on_hold' ? 'dot-blinking-yellow' : ''}`}
                      style={{ width: '18px', height: '18px' }}
                      title="Yellow: System On Hold"
                    />
                    {/* Green Dot (Active) */}
                    <span 
                      className={`dot-green ${selectedStatus === 'active' ? 'dot-blinking-green' : ''}`}
                      style={{ width: '18px', height: '18px' }}
                      title="Green: System Active"
                    />
                  </div>
                </div>
              </div>

              {/* Status readout */}
              <div className="fw-bold text-dark font-monospace mb-1" style={{ fontSize: '0.94rem' }}>
                Leadora <span className="text-primary">PRO</span>
              </div>

              <div className="d-flex align-items-center gap-1.5 justify-content-center">
                <span 
                  className="rounded-circle"
                  style={{ width: '8px', height: '8px', backgroundColor: activeMeta.dotColor }}
                />
                <span className="small fw-semibold" style={{ color: activeMeta.dotColor, fontSize: '0.8rem' }}>
                  {activeMeta.label}
                </span>
              </div>
              <div className="text-muted mt-1 small" style={{ fontSize: '0.72rem' }}>
                Blinking dot: <strong className="text-capitalize">{activeMeta.type.replace('_', ' ')} ({activeMeta.dotClass.replace('dot-', '')})</strong>
              </div>
            </div>

            {/* Quick Switch Guide */}
            <div className="mt-3 p-2.5 rounded-2 bg-light border small text-muted" style={{ fontSize: '0.75rem' }}>
              <div className="fw-semibold text-dark mb-1">Color Code Reference:</div>
              <div className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1.5"><span className="dot-green" style={{ width: '7px', height: '7px' }} /> Green</span>
                  <span>System Active</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1.5"><span className="dot-red" style={{ width: '7px', height: '7px' }} /> Red</span>
                  <span>System Inactive</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1.5"><span className="dot-yellow" style={{ width: '7px', height: '7px' }} /> Yellow</span>
                  <span>System On Hold</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1.5"><span className="dot-blue" style={{ width: '7px', height: '7px' }} /> Blue</span>
                  <span>System Upgradation</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Row: System Telemetry & Audit Log */}
      <div className="row g-4">
        
        {/* System Services Health */}
        <div className="col-12 col-md-6">
          <div className="g-card p-3 p-sm-4 h-100">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <Server size={18} className="text-primary" />
              Service Diagnostics &amp; Engine Status
            </h3>

            <div className="d-flex flex-column gap-2.5">
              
              <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
                <div className="d-flex align-items-center gap-2">
                  <Globe2 size={16} className="text-primary" />
                  <div>
                    <div className="fw-semibold small">Google Places API Engine</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>TextSearch &amp; NearbySearch Scraper</div>
                  </div>
                </div>
                <span className="badge badge-g-green rounded-pill">ONLINE</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
                <div className="d-flex align-items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <div>
                    <div className="fw-semibold small">Gemini 2.5 Flash Enrichment</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>AI Phone, Email &amp; Web Scraper</div>
                  </div>
                </div>
                <span className="badge badge-g-green rounded-pill">ONLINE</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
                <div className="d-flex align-items-center gap-2">
                  <Database size={16} className="text-success" />
                  <div>
                    <div className="fw-semibold small">Commercial Categories DB</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Custom CRUD &amp; 14 Presets</div>
                  </div>
                </div>
                <span className="badge badge-g-green rounded-pill">READY</span>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
                <div className="d-flex align-items-center gap-2">
                  <HardDrive size={16} className="text-secondary" />
                  <div>
                    <div className="fw-semibold small">Express Backend Proxy</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Port 3000 / Node Runtime</div>
                  </div>
                </div>
                <span className="badge bg-light text-dark border rounded-pill">PORT 3000</span>
              </div>

            </div>
          </div>
        </div>

        {/* Audit Log / Event Feed */}
        <div className="col-12 col-md-6">
          <div className="g-card p-3 p-sm-4 h-100">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <Layers size={18} className="text-primary" />
              Status Audit Activity
            </h3>

            <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {logs.map((log, idx) => (
                <div key={idx} className="p-2 rounded-2 bg-light border d-flex align-items-start gap-2">
                  <span 
                    className="badge bg-secondary-subtle text-secondary rounded-pill font-monospace flex-shrink-0 mt-0.5"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {log.time}
                  </span>
                  <span className="small text-dark" style={{ fontSize: '0.78rem' }}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
