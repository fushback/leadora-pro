import React from 'react';
import { Search, Users, Download, Layers, ShieldCheck } from 'lucide-react';

interface MobileFooterNavProps {
  activeStep: number;
  onNavigateStep: (step: number) => void;
  currentView: 'workflow' | 'admin' | 'github-vercel';
  onToggleAdmin: () => void;
  onOpenCategoriesAndInterests: () => void;
  leadCount: number;
}

export const MobileFooterNav: React.FC<MobileFooterNavProps> = ({
  activeStep,
  onNavigateStep,
  currentView,
  onToggleAdmin,
  onOpenCategoriesAndInterests,
  leadCount
}) => {
  return (
    <nav
      className="mobile-footer-nav position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-sm"
      style={{
        zIndex: 1040,
        height: '62px',
        borderColor: '#E2E8F0',
        boxShadow: '0 -4px 18px rgba(15, 23, 42, 0.06)',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.97)'
      }}
      aria-label="Mobile Navigation"
    >
      <div className="container-xl h-100 px-1 px-sm-3 d-flex align-items-center justify-content-around">
        
        {/* Tab 1: Search */}
        <button
          type="button"
          onClick={() => onNavigateStep(1)}
          className={`btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-grow-1 border-0 ${
            activeStep === 1 && currentView === 'workflow'
              ? 'text-primary fw-bold'
              : 'text-secondary'
          }`}
          style={{ minWidth: '60px' }}
          title="Search & Extract Leads"
        >
          <div
            className={`d-flex align-items-center justify-content-center rounded-pill mb-0.5 ${
              activeStep === 1 && currentView === 'workflow' ? 'bg-primary-subtle px-2 py-0.5' : ''
            }`}
          >
            <Search size={20} className={activeStep === 1 && currentView === 'workflow' ? 'text-primary' : 'text-muted'} />
          </div>
          <span style={{ fontSize: '0.70rem', letterSpacing: '-0.2px' }}>Search</span>
        </button>

        {/* Tab 2: Leads Table */}
        <button
          type="button"
          onClick={() => onNavigateStep(2)}
          className={`btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-grow-1 border-0 position-relative ${
            activeStep === 2 && currentView === 'workflow'
              ? 'text-primary fw-bold'
              : 'text-secondary'
          }`}
          style={{ minWidth: '60px' }}
          title="Leads Database & Contacts"
        >
          <div
            className={`d-flex align-items-center justify-content-center rounded-pill mb-0.5 position-relative ${
              activeStep === 2 && currentView === 'workflow' ? 'bg-primary-subtle px-2 py-0.5' : ''
            }`}
          >
            <Users size={20} className={activeStep === 2 && currentView === 'workflow' ? 'text-primary' : 'text-muted'} />
            {leadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                style={{ fontSize: '0.58rem', padding: '0.2em 0.45em' }}
              >
                {leadCount > 99 ? '99+' : leadCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.70rem', letterSpacing: '-0.2px' }}>Leads</span>
        </button>

        {/* Tab 3: Export */}
        <button
          type="button"
          onClick={() => onNavigateStep(3)}
          className={`btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-grow-1 border-0 ${
            activeStep === 3 && currentView === 'workflow'
              ? 'text-primary fw-bold'
              : 'text-secondary'
          }`}
          style={{ minWidth: '60px' }}
          title="Export VCF & Excel"
        >
          <div
            className={`d-flex align-items-center justify-content-center rounded-pill mb-0.5 ${
              activeStep === 3 && currentView === 'workflow' ? 'bg-primary-subtle px-2 py-0.5' : ''
            }`}
          >
            <Download size={20} className={activeStep === 3 && currentView === 'workflow' ? 'text-primary' : 'text-muted'} />
          </div>
          <span style={{ fontSize: '0.70rem', letterSpacing: '-0.2px' }}>Export</span>
        </button>

        {/* Tab 4: Category & Interest Manager */}
        <button
          type="button"
          onClick={onOpenCategoriesAndInterests}
          className="btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-grow-1 border-0 text-secondary"
          style={{ minWidth: '60px' }}
          title="Manage Categories & Interests"
        >
          <div className="d-flex align-items-center justify-content-center rounded-pill mb-0.5">
            <Layers size={20} className="text-muted" />
          </div>
          <span style={{ fontSize: '0.70rem', letterSpacing: '-0.2px' }}>Categories</span>
        </button>

        {/* Tab 5: Admin Panel */}
        <button
          type="button"
          onClick={onToggleAdmin}
          className={`btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center justify-content-center flex-grow-1 border-0 ${
            currentView === 'admin'
              ? 'text-primary fw-bold'
              : 'text-secondary'
          }`}
          style={{ minWidth: '60px' }}
          title="Admin Settings & Roles"
        >
          <div
            className={`d-flex align-items-center justify-content-center rounded-pill mb-0.5 ${
              currentView === 'admin' ? 'bg-primary-subtle px-2 py-0.5' : ''
            }`}
          >
            <ShieldCheck size={20} className={currentView === 'admin' ? 'text-primary' : 'text-muted'} />
          </div>
          <span style={{ fontSize: '0.70rem', letterSpacing: '-0.2px' }}>Admin</span>
        </button>

      </div>
    </nav>
  );
};
