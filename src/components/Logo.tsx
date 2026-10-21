import React from 'react';

interface LogoProps {
  height?: number | string;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  height = 36,
  className = '',
  showText = true
}) => {
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      {/* Red vertical brand ribbon badge matching the user image */}
      <div 
        className="rounded-bottom-2 shadow-xs d-flex flex-column justify-content-end align-items-center overflow-hidden flex-shrink-0"
        style={{
          width: '28px',
          height: '42px',
          backgroundColor: '#E50914',
          padding: '2px 2px 4px 2px',
          lineHeight: 1
        }}
        title="SiMPL GOOD"
      >
        <div className="d-flex flex-column align-items-center justify-content-end text-white text-center w-100 select-none">
          <span 
            style={{ 
              fontFamily: "'Impact', 'Arial Black', sans-serif", 
              fontSize: '8px', 
              letterSpacing: '0.4px',
              textTransform: 'none',
              transform: 'scaleY(1.15)',
              display: 'block'
            }}
          >
            SiMPL
          </span>
          <span 
            style={{ 
              fontFamily: "'Impact', 'Arial Black', sans-serif", 
              fontSize: '8px', 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              transform: 'scaleY(1.15)',
              marginTop: '1px',
              display: 'block'
            }}
          >
            GOOD
          </span>
        </div>
      </div>

      {showText && (
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center gap-1.5">
            <span className="fw-bold text-dark fs-6 lh-1" style={{ letterSpacing: '-0.3px' }}>
              SiMPL GOOD
            </span>
            <span 
              className="badge text-white px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#E50914', fontSize: '0.62rem', fontWeight: 600 }}
            >
              LEADS
            </span>
          </div>
          <small className="text-muted d-none d-sm-block" style={{ fontSize: '0.68rem', marginTop: '1px' }}>
            Google Maps Lead Generator
          </small>
        </div>
      )}
    </div>
  );
};
