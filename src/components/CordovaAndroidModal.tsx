import React, { useState } from 'react';
import { Smartphone, Download, Terminal, CheckCircle2, Copy, ShieldCheck, Cpu, QrCode, Share2, Sparkles, Code2, FolderArchive } from 'lucide-react';

interface CordovaAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CordovaAndroidModal: React.FC<CordovaAndroidModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSourceLink, setCopiedSourceLink] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!isOpen) return null;

  // Use the public shared app domain or current origin
  const baseUrl = window.location.origin.includes('localhost') 
    ? 'https://ais-pre-yqdr3xo274r2hb2ixukokk-735125405373.asia-east1.run.app'
    : window.location.origin;

  const publicApkUrl = `${baseUrl}/downloads/b2b-lead-pro.apk`;
  const publicSourceZipUrl = `${baseUrl}/downloads/b2b-lead-pro-source-code.zip`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(publicApkUrl)}`;

  const handleCopyApkLink = () => {
    navigator.clipboard.writeText(publicApkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopySourceLink = () => {
    navigator.clipboard.writeText(publicSourceZipUrl);
    setCopiedSourceLink(true);
    setTimeout(() => setCopiedSourceLink(false), 2500);
  };

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDirectApkDownload = () => {
    setIsDownloadingApk(true);
    window.location.href = '/api/download-apk';
    setTimeout(() => setIsDownloadingApk(false), 2000);
  };

  const handleDownloadCordovaZip = () => {
    setIsDownloadingZip(true);
    window.location.href = '/api/cordova/download-bundle';
    setTimeout(() => setIsDownloadingZip(false), 2000);
  };

  const steps = [
    {
      title: '1. Install Cordova CLI globally',
      code: 'npm install -g cordova'
    },
    {
      title: '2. Add Android Platform',
      code: 'cordova platform add android@13'
    },
    {
      title: '3. Compile Android APK',
      code: 'cordova build android'
    }
  ];

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow border-0 rounded-3 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header bg-white border-bottom py-2.5 px-3">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: '32px', height: '32px', backgroundColor: '#E6F4EA', color: '#137333' }}
              >
                <Smartphone size={18} />
              </div>
              <div>
                <h5 className="modal-title fs-6 fw-bold text-dark mb-0">
                  Android APK & Complete Project Downloads
                </h5>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Package: <code className="text-success">com.b2blead.pro</code> • Clean Source Code & Ready APK
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body p-3 p-sm-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* Primary Action Card: Direct APK Download & Public Link */}
            <div className="card border-success border-2 shadow-xs mb-3 overflow-hidden">
              <div className="card-header bg-success text-white py-2 px-3 d-flex align-items-center justify-content-between">
                <span className="fw-semibold small d-flex align-items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Public Direct APK Link</span>
                </span>
                <span className="badge bg-white text-success rounded-pill" style={{ fontSize: '0.62rem' }}>
                  Instant Download
                </span>
              </div>
              
              <div className="card-body p-3 bg-white">
                <div className="row g-3 align-items-center">
                  
                  {/* QR Code column */}
                  <div className="col-12 col-sm-auto text-center">
                    <div className="p-1 border rounded-2 bg-light d-inline-block shadow-xs">
                      <img 
                        src={qrCodeUrl} 
                        alt="Scan QR Code to download APK on Android" 
                        width={105} 
                        height={105}
                        style={{ display: 'block' }}
                      />
                    </div>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.65rem' }}>
                      <QrCode size={11} className="me-1 inline" />
                      Scan with phone camera
                    </div>
                  </div>

                  {/* Actions & Public URL */}
                  <div className="col-12 col-sm">
                    <h6 className="fw-bold text-dark mb-1 fs-6">
                      Download B2B Lead Pro APK directly
                    </h6>
                    <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                      Tap the button below or copy the direct public URL to download and install on any Android device.
                    </p>

                    {/* Direct Download Buttons */}
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                      <button
                        type="button"
                        onClick={handleDirectApkDownload}
                        disabled={isDownloadingApk}
                        className="btn btn-g-green btn-sm d-flex align-items-center gap-1.5 px-3 py-2 shadow-xs"
                      >
                        <Download size={14} />
                        <span className="fw-bold">{isDownloadingApk ? 'Downloading APK...' : 'Download APK Directly (.apk)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadCordovaZip}
                        disabled={isDownloadingZip}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-2"
                        title="Download complete Cordova source project"
                      >
                        <FolderArchive size={13} />
                        <span>{isDownloadingZip ? 'Preparing ZIP...' : 'Cordova App Bundle (.zip)'}</span>
                      </button>
                    </div>

                    {/* Public URL Box */}
                    <div className="d-flex align-items-center bg-light border rounded-2 p-1.5 gap-1.5">
                      <Share2 size={13} className="text-muted flex-shrink-0 ms-1" />
                      <input 
                        type="text" 
                        readOnly 
                        value={publicApkUrl}
                        className="form-control form-control-sm bg-transparent border-0 font-monospace p-0 text-dark flex-grow-1"
                        style={{ fontSize: '0.7rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleCopyApkLink}
                        className={`btn btn-sm py-1 px-2.5 rounded-2 d-flex align-items-center gap-1 flex-shrink-0 ${
                          copiedLink ? 'btn-success text-white' : 'btn-dark text-white'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {copiedLink ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>

                    <div className="mt-1.5 text-muted small" style={{ fontSize: '0.68rem' }}>
                      💡 Android Tip: If prompted during installation, tap <strong>"Settings &gt; Allow from this source"</strong> to complete install.
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Complete Clean Project Source Code Download Card */}
            <div className="card border-primary border-1 shadow-xs mb-3 overflow-hidden">
              <div className="card-header bg-light border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
                <span className="fw-semibold small text-primary d-flex align-items-center gap-1.5">
                  <Code2 size={15} />
                  <span>Complete Project Source Code (Clean without Build)</span>
                </span>
                <span className="badge bg-primary text-white rounded-pill" style={{ fontSize: '0.62rem' }}>
                  No node_modules • ~95 KB
                </span>
              </div>
              <div className="card-body p-3 bg-white">
                <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                  Contains all clean TypeScript source codes, React components, server routes, Cordova config, GitHub Actions workflows, and assets, without bloated build directories.
                </p>

                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                  <a
                    href="/downloads/b2b-lead-pro-source-code.zip"
                    download="b2b-lead-pro-source-code.zip"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-2 text-decoration-none shadow-xs"
                  >
                    <Download size={14} />
                    <span className="fw-bold">Download All Codes (.ZIP)</span>
                  </a>

                  <div className="d-flex align-items-center bg-light border rounded-2 p-1.5 gap-1.5 flex-grow-1">
                    <Share2 size={12} className="text-muted flex-shrink-0 ms-1" />
                    <input 
                      type="text" 
                      readOnly 
                      value={publicSourceZipUrl}
                      className="form-control form-control-sm bg-transparent border-0 font-monospace p-0 text-dark flex-grow-1"
                      style={{ fontSize: '0.7rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopySourceLink}
                      className={`btn btn-sm py-1 px-2.5 rounded-2 d-flex align-items-center gap-1 flex-shrink-0 ${
                        copiedSourceLink ? 'btn-success text-white' : 'btn-outline-dark'
                      }`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {copiedSourceLink ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      <span>{copiedSourceLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Build Locally Section */}
            <div className="mb-3">
              <h6 className="fw-bold text-dark fs-6 mb-2 d-flex align-items-center gap-1.5">
                <Terminal size={14} className="text-primary" />
                <span>Build & Sign Custom APK with Cordova CLI</span>
              </h6>

              <div className="d-flex flex-column gap-2">
                {steps.map((s, idx) => (
                  <div key={idx} className="bg-white border rounded-2 p-2 shadow-xs">
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                      {s.title}
                    </div>
                    <div className="d-flex align-items-center justify-content-between bg-dark text-light p-2 rounded font-monospace small">
                      <code className="text-light" style={{ fontSize: '0.78rem' }}>{s.code}</code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(s.code, idx)}
                        className="btn btn-sm btn-link text-decoration-none text-light p-0 ms-2"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Android Feature Highlights */}
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="border rounded-2 p-2.5 bg-white h-100 shadow-xs">
                  <div className="d-flex align-items-center gap-1.5 text-success fw-bold small mb-1">
                    <ShieldCheck size={14} />
                    <span>Android Permissions Configured</span>
                  </div>
                  <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                    Configured in <code>config.xml</code> for full network access and external storage downloads (Spreadsheet &amp; VCF export).
                  </small>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="border rounded-2 p-2.5 bg-white h-100 shadow-xs">
                  <div className="d-flex align-items-center gap-1.5 text-primary fw-bold small mb-1">
                    <Cpu size={14} />
                    <span>Native WebView & Plugins Ready</span>
                  </div>
                  <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                    Cordova StatusBar, Splashscreen, Whitelist, and File System plugins pre-wired for Android 8 through Android 15.
                  </small>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-3 justify-content-between">
            <span className="text-muted small" style={{ fontSize: '0.73rem' }}>
              Compatible with Android 8.0+ (API 26-35)
            </span>
            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
