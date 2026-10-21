import React from 'react';
import { ToastNotification } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="flash-message-container" aria-live="polite">
      {toasts.map((toast) => {
        let accentColor = '#38BDF8';
        let badgeBg = 'rgba(56, 189, 248, 0.18)';
        let icon = <Sparkles size={16} className="flex-shrink-0" style={{ color: '#38BDF8' }} />;

        if (toast.type === 'success') {
          accentColor = '#10B981';
          badgeBg = 'rgba(16, 185, 129, 0.2)';
          icon = <CheckCircle2 size={16} className="flex-shrink-0" style={{ color: '#10B981' }} />;
        } else if (toast.type === 'error') {
          accentColor = '#F43F5E';
          badgeBg = 'rgba(244, 63, 94, 0.2)';
          icon = <XCircle size={16} className="flex-shrink-0" style={{ color: '#F43F5E' }} />;
        } else if (toast.type === 'warning') {
          accentColor = '#F59E0B';
          badgeBg = 'rgba(245, 158, 11, 0.2)';
          icon = <AlertTriangle size={16} className="flex-shrink-0" style={{ color: '#F59E0B' }} />;
        }

        const durationSeconds = (toast.duration || 3000) / 1000;

        return (
          <div
            key={toast.id}
            className="flash-message-pill"
            role="status"
          >
            {/* Modern Accent Indicator Icon */}
            <div
              className="d-flex align-items-center justify-content-center p-1.5 rounded-circle flex-shrink-0"
              style={{ backgroundColor: badgeBg }}
            >
              {icon}
            </div>

            <div className="flex-grow-1 min-w-0" style={{ textAlign: 'left' }}>
              {toast.title && (
                <div className="fw-bold text-white mb-0.5" style={{ fontSize: '0.82rem', letterSpacing: '-0.01em' }}>
                  {toast.title}
                </div>
              )}
              <div className="text-light" style={{ fontSize: '0.78rem', opacity: 0.94, lineHeight: 1.35 }}>
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="btn btn-link p-0 text-decoration-none shadow-none ms-1 flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
              style={{ color: '#94A3B8', border: 'none', background: 'rgba(255, 255, 255, 0.08)', width: '22px', height: '22px' }}
              aria-label="Close notification"
            >
              <X size={12} />
            </button>

            {/* 3-Second Flash Progress Timer */}
            <div
              className="flash-message-progress"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, #818CF8)`,
                animationDuration: `${durationSeconds}s`
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
