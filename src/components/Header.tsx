import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  FileSpreadsheet, 
  Contact, 
  SlidersHorizontal, 
  Smartphone, 
  Cloud,
  User,
  Settings,
  LogOut,
  Edit3,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Cpu,
  Github
} from 'lucide-react';
import { UserProfile } from '../utils/userProfile';
import { SystemStatusType, STATUS_OPTIONS } from '../utils/systemStatus';

interface HeaderProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  leadsCount: number;
  phoneCount: number;
  canAccessStep2And3?: boolean;
  onOpenCategories: () => void;
  onOpenCordovaModal: () => void;
  onOpenDeployModal: () => void;
  onOpenEditProfile: (initialTab?: 'profile' | 'github-vercel') => void;
  onOpenSettings: () => void;
  userProfile: UserProfile;
  onLogout: () => void;
  systemStatus?: SystemStatusType;
  onNavigateToAdmin?: () => void;
  onNavigateToGitHubVercel?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeStep,
  setActiveStep,
  leadsCount,
  phoneCount,
  canAccessStep2And3 = false,
  onOpenCategories,
  onOpenCordovaModal,
  onOpenDeployModal,
  onOpenEditProfile,
  onOpenSettings,
  userProfile,
  onLogout,
  systemStatus = 'active',
  onNavigateToAdmin,
  onNavigateToGitHubVercel,
  onLogoClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusMeta = STATUS_OPTIONS[systemStatus] || STATUS_OPTIONS.active;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const initials = userProfile.initials || 'AM';
  const avatarBg = userProfile.avatarColor || '#1a73e8';

  const handleBrandClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      setActiveStep(1);
    }
  };

  return (
    <header className="bg-white border-bottom sticky-top" style={{ zIndex: 1020, boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)' }}>
      {/* Animated 4-Color Gradient Shimmer Line */}
      <div className="quad-gradient-line" style={{ height: '2px' }} />

      {/* Ultra-compact single-line navbar */}
      <div className="container-xl py-1 px-2 px-sm-3">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-nowrap w-100" style={{ minHeight: '36px' }}>
          
          {/* Left: Brand Logo & Title (Leadora PRO) with 4-Color Blinking Indicator */}
          <div 
            className="d-flex align-items-center gap-2 cursor-pointer flex-shrink-0 p-1 rounded-2 hover-bg-light"
            onClick={handleBrandClick}
            style={{ cursor: 'pointer', height: '32px' }}
            title={`Leadora PRO - Status: ${statusMeta.label} (${statusMeta.detail})`}
            aria-label="Home"
          >
            {/* 4-Color Dots Logo:
                Green dot blinks if system is active,
                Red dot blinks if system is inactive,
                Yellow dot blinks if system is on hold,
                Blue dot blinks if system is on upgradation */}
            <div className="quad-dot-logo" title={`Leadora PRO (${statusMeta.label})`}>
              <span 
                className={`dot-blue ${systemStatus === 'upgradation' ? 'dot-blinking-blue' : ''}`}
                title="Blue: System Upgradation" 
              />
              <span 
                className={`dot-red ${systemStatus === 'inactive' ? 'dot-blinking-red' : ''}`} 
                title="Red: System Inactive" 
              />
              <span 
                className={`dot-yellow ${systemStatus === 'on_hold' ? 'dot-blinking-yellow' : ''}`} 
                title="Yellow: System On Hold" 
              />
              <span 
                className={`dot-green ${systemStatus === 'active' ? 'dot-blinking-green' : ''}`} 
                title="Green: System Active" 
              />
            </div>
            <span className="fw-bold text-dark" style={{ fontSize: '0.94rem', letterSpacing: '-0.3px' }}>
              Leadora <span className="text-primary font-monospace">PRO</span>
            </span>
          </div>

          {/* Right Group: 3 Step Navigation Icons, followed by Profile Dropdown Circle Icon at the EXTREME RIGHT */}
          <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0 ms-auto">
            
            {/* 1. The 3 Step Icons Navigation */}
            <div 
              className="d-flex align-items-center p-0.5 bg-light rounded-pill border flex-shrink-0" 
              style={{ gap: '2px' }}
            >
              {/* Step 1: Search */}
              <button
                type="button"
                onClick={() => {
                  if (onLogoClick) onLogoClick();
                  setActiveStep(1);
                }}
                className={`step-nav-pill d-inline-flex align-items-center justify-content-center p-0 ${activeStep === 1 ? 'active-step-1' : ''}`}
                style={{ width: '32px', height: '32px' }}
                title="Step 1: Search B2B Leads"
                aria-label="Search"
              >
                <Search size={16} className={activeStep === 1 ? 'text-primary' : 'text-muted'} />
              </button>

              {/* Step 2: Leads */}
              <button
                type="button"
                onClick={() => {
                  if (onLogoClick) onLogoClick();
                  setActiveStep(2);
                }}
                className={`step-nav-pill d-inline-flex align-items-center justify-content-center gap-1.5 ${leadsCount > 0 ? 'px-2' : 'p-0'} ${activeStep === 2 ? 'active-step-2' : ''}`}
                style={{ 
                  height: '32px', 
                  minWidth: '32px',
                  cursor: 'pointer'
                }}
                title="Step 2: Leads & Spreadsheet"
                aria-label="Leads"
              >
                <FileSpreadsheet size={16} className={activeStep === 2 ? 'text-success' : 'text-muted'} />
                {leadsCount > 0 && (
                  <span
                    className="badge rounded-pill d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{
                      fontSize: '0.65rem',
                      height: '18px',
                      minWidth: '20px',
                      padding: '0 5px',
                      lineHeight: 1,
                      backgroundColor: activeStep === 2 ? 'var(--g-green)' : '#E2E8F0',
                      color: activeStep === 2 ? '#FFFFFF' : '#334155'
                    }}
                  >
                    {leadsCount}
                  </span>
                )}
              </button>

              {/* Step 3: VCF Export */}
              <button
                type="button"
                onClick={() => {
                  if (onLogoClick) onLogoClick();
                  setActiveStep(3);
                }}
                className={`step-nav-pill d-inline-flex align-items-center justify-content-center gap-1.5 ${phoneCount > 0 ? 'px-2' : 'p-0'} ${activeStep === 3 ? 'active-step-3' : ''}`}
                style={{ 
                  height: '32px', 
                  minWidth: '32px',
                  cursor: 'pointer'
                }}
                title="Step 3: VCF Export"
                aria-label="VCF Export"
              >
                <Contact size={16} className={activeStep === 3 ? 'text-danger' : 'text-muted'} />
                {phoneCount > 0 && (
                  <span
                    className="badge rounded-pill d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{
                      fontSize: '0.65rem',
                      height: '18px',
                      minWidth: '20px',
                      padding: '0 5px',
                      lineHeight: 1,
                      backgroundColor: activeStep === 3 ? 'var(--g-red)' : '#E2E8F0',
                      color: activeStep === 3 ? '#FFFFFF' : '#334155'
                    }}
                  >
                    {phoneCount}
                  </span>
                )}
              </button>
            </div>

            {/* 2. Profile Dropdown Circle Icon at the EXTREME RIGHT */}
            <div className="position-relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="btn p-0 rounded-circle border-0 position-relative d-inline-flex align-items-center justify-content-center cursor-pointer shadow-xs"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: avatarBg,
                  color: '#ffffff',
                  outline: isDropdownOpen ? `2px solid ${avatarBg}` : 'none',
                  outlineOffset: '2px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                title={`Profile: ${userProfile.name} (${userProfile.email})`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="fw-bold font-monospace user-select-none" style={{ fontSize: '0.78rem', lineHeight: 1 }}>
                  {initials}
                </span>

                {/* Online Indicator Green Dot */}
                <span 
                  className="position-absolute rounded-circle border border-white"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    bottom: '-1px',
                    right: '-1px'
                  }}
                  title="Online"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="position-absolute bg-white rounded-3 border shadow-lg overflow-hidden py-1"
                  style={{
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '290px',
                    zIndex: 1050,
                    animation: 'fadeInScale 0.15s ease-out'
                  }}
                >
                  {/* User Profile Header Details */}
                  <div className="px-3 py-2.5 bg-light border-bottom">
                    <div className="d-flex align-items-center gap-2.5 mb-1.5">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs flex-shrink-0"
                        style={{ width: '38px', height: '38px', backgroundColor: avatarBg, fontSize: '0.88rem' }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-1">
                          <span className="fw-bold text-dark text-truncate small" style={{ fontSize: '0.86rem' }}>
                            {userProfile.name}
                          </span>
                          <span title="Verified PRO" className="d-inline-flex align-items-center">
                            <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                          </span>
                        </div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.73rem' }}>
                          {userProfile.email}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-2 pt-1.5 border-top">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenEditProfile('profile');
                        }}
                        className="btn btn-sm btn-link text-primary text-decoration-none p-0 d-inline-flex align-items-center gap-1 fw-semibold"
                        style={{ fontSize: '0.73rem' }}
                      >
                        <Edit3 size={12} />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (onNavigateToGitHubVercel) {
                            onNavigateToGitHubVercel();
                          } else {
                            onOpenEditProfile('github-vercel');
                          }
                        }}
                        className="btn btn-sm btn-link text-dark text-decoration-none p-0 d-inline-flex align-items-center gap-1 fw-semibold"
                        style={{ fontSize: '0.73rem' }}
                      >
                        <Github size={12} />
                        <span>GitHub/Vercel</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Panel Link */}
                  {onNavigateToAdmin && (
                    <>
                      <div className="px-3 pt-2 pb-1">
                        <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                          System Administration
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigateToAdmin();
                        }}
                        className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-dark"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0" 
                          style={{ 
                            width: '28px', 
                            height: '28px',
                            backgroundColor: statusMeta.badgeBg,
                            color: statusMeta.dotColor
                          }}
                        >
                          <Cpu size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Admin Panel</span>
                            <span 
                              className="badge rounded-pill font-monospace"
                              style={{ 
                                fontSize: '0.62rem', 
                                padding: '1px 6px',
                                backgroundColor: statusMeta.badgeBg,
                                color: statusMeta.dotColor,
                                border: `1px solid ${statusMeta.dotColor}44`
                              }}
                            >
                              {statusMeta.type.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>Set system status &amp; blinking dot</div>
                        </div>
                      </button>

                      <div className="dropdown-divider my-1" />
                    </>
                  )}

                  {/* Section: Three Tools (Categories, Android APK, Cloud Deploy) */}
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                      Workspace Tools
                    </span>
                  </div>

                  {/* Tool 1: Commercial Categories */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenCategories();
                    }}
                    className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-dark"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-light text-secondary flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <SlidersHorizontal size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Commercial Categories</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>Industry tags &amp; commercial presets</div>
                    </div>
                  </button>

                  {/* Tool 2: Android Cordova APK */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenCordovaModal();
                    }}
                    className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-dark"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-light text-success flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <Smartphone size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Android App (.apk)</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>Cordova builder &amp; mobile package</div>
                    </div>
                  </button>

                  {/* Tool 3: Cloud Deploy (Vercel & GitHub) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onNavigateToGitHubVercel) {
                        onNavigateToGitHubVercel();
                      } else {
                        onOpenDeployModal();
                      }
                    }}
                    className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-dark"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-light text-primary flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <Cloud size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Deploy to Cloud</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>GitHub &amp; Vercel deployment sync</div>
                    </div>
                  </button>

                  <div className="dropdown-divider my-1" />

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-dark"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-light text-secondary flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <Settings size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Settings &amp; Preferences</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>Radius, AI enrichment &amp; exports</div>
                    </div>
                  </button>

                  <div className="dropdown-divider my-1" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="dropdown-item d-flex align-items-center gap-2.5 px-3 py-2 text-danger"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-danger-subtle text-danger flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <LogOut size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }}>Log Out</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>End current session</div>
                    </div>
                  </button>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
