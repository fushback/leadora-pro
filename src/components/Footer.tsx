import React from 'react';

interface FooterProps {
  // Optional legacy props kept for backward compatibility if any
  recentSearches?: any[];
  onSelectSearch?: (item: any) => void;
  onClearSearches?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="mt-auto bg-white" style={{ marginBottom: '62px' }}>
      {/* 4-Color Gradient Shimmer Line */}
      <div className="quad-gradient-line" style={{ height: '2px' }} />

      {/* Single Line Footer */}
      <div className="py-2.5 bg-white text-center" style={{ fontSize: '0.75rem' }}>
        <div className="container-xl px-3 d-flex align-items-center justify-content-center">
          <span className="text-muted">
            &copy; {new Date().getFullYear()} Leadora PRO
          </span>
        </div>
      </div>
    </footer>
  );
};
