import React, { useState } from 'react';
import { 
  X, 
  Github, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Cloud, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Layers
} from 'lucide-react';

interface DeployGithubVercelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGithubVercelModal: React.FC<DeployGithubVercelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'github' | 'download'>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gitCommands = `# 1. Initialize git repository
git init
git branch -M main

# 2. Stage all files
git add .

# 3. Commit files
git commit -m "feat: B2B Lead PRO full-stack app"

# 4. Link to your GitHub repository (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/b2b-lead-pro.git

# 5. Push to GitHub
git push -u origin main`;

  const vercelCliCommands = `# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Log in to Vercel
vercel login

# 3. Deploy preview
vercel

# 4. Deploy to production
vercel --prod`;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.45)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 1060 
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-4 shadow-lg border w-100 overflow-hidden d-flex flex-column"
        style={{ 
          maxWidth: '780px', 
          maxHeight: '90vh',
          borderColor: '#E2E8F0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with 4-Color Gradient Shimmer */}
        <div className="quad-gradient-line" />
        
        <div className="p-3 p-sm-4 border-bottom d-flex align-items-center justify-content-between bg-white">
          <div className="d-flex align-items-center gap-2.5">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-xs"
              style={{ width: '38px', height: '38px', backgroundColor: 'var(--g-blue)' }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <span>Deploy to Vercel &amp; GitHub</span>
                <span className="badge badge-g-blue rounded-pill fw-semibold" style={{ fontSize: '0.65rem' }}>
                  Web Version
                </span>
              </h2>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Complete source code, Vercel configuration &amp; step-by-step deploy instructions
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light border-0 rounded-circle p-1.5 text-muted hover:text-dark"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 px-sm-4 pt-2.5 pb-2 bg-light border-bottom d-flex align-items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
              activeTab === 'vercel' 
                ? 'bg-white text-dark shadow-xs border' 
                : 'text-muted border-0 bg-transparent'
            }`}
            style={{ fontSize: '0.8rem' }}
          >
            <Cloud size={14} className="text-primary" />
            <span>1. Deploy to Vercel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
              activeTab === 'github' 
                ? 'bg-white text-dark shadow-xs border' 
                : 'text-muted border-0 bg-transparent'
            }`}
            style={{ fontSize: '0.8rem' }}
          >
            <Github size={14} className="text-dark" />
            <span>2. Push to GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
              activeTab === 'download' 
                ? 'bg-white text-success shadow-xs border' 
                : 'text-muted border-0 bg-transparent'
            }`}
            style={{ fontSize: '0.8rem' }}
          >
            <Download size={14} className="text-success" />
            <span>3. Download Full Project ZIP</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 p-sm-4 overflow-y-auto" style={{ fontSize: '0.84rem' }}>
          {/* TAB 1: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 bg-light border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                    <Globe size={15} className="text-primary" />
                    <span>Option A: Deploy via Vercel Web Dashboard (Recommended)</span>
                  </div>
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-g-blue rounded-pill py-0.5 px-2.5 d-flex align-items-center gap-1 text-decoration-none"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <span>Open Vercel</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <ol className="mb-0 ps-3 text-secondary" style={{ lineHeight: '1.6' }}>
                  <li>Push this project to your GitHub account (see the GitHub tab).</li>
                  <li>Visit <strong>vercel.com/new</strong> and select your GitHub repository.</li>
                  <li>
                    Framework preset: Select <strong>Vite</strong>. The included <code>vercel.json</code> configures both the SPA frontend and <code>/api</code> routes automatically.
                  </li>
                  <li>
                    In <strong>Environment Variables</strong>, enter:
                    <ul className="mb-1 mt-1">
                      <li><code>VITE_GOOGLE_MAPS_API_KEY</code>: Your Google Maps Places API key</li>
                      <li><code>GEMINI_API_KEY</code>: Your Gemini API key (optional)</li>
                    </ul>
                  </li>
                  <li>Click <strong>Deploy</strong>. Your app goes live with continuous deployment!</li>
                </ol>
              </div>

              <div className="p-3 rounded-3 bg-light border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                    <Terminal size={15} className="text-dark" />
                    <span>Option B: Deploy via Vercel CLI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vercelCliCommands, 'vercel-cli')}
                    className="btn btn-sm btn-outline-secondary rounded-pill py-0.5 px-2.5 d-flex align-items-center gap-1 bg-white"
                    style={{ fontSize: '0.72rem' }}
                  >
                    {copiedKey === 'vercel-cli' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>{copiedKey === 'vercel-cli' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre 
                  className="p-2.5 bg-dark text-light rounded-3 mb-0 font-monospace overflow-x-auto" 
                  style={{ fontSize: '0.75rem', lineHeight: '1.45' }}
                >
                  {vercelCliCommands}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB */}
          {activeTab === 'github' && (
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3 bg-light border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                    <Github size={16} />
                    <span>Push to GitHub Repository</span>
                  </div>
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-dark rounded-pill py-0.5 px-2.5 d-flex align-items-center gap-1 bg-white text-decoration-none"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <span>Create GitHub Repo</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <p className="text-muted mb-2" style={{ fontSize: '0.78rem' }}>
                  Create a new repository on GitHub (e.g. <code>b2b-lead-pro</code>), then run these commands inside your project folder:
                </p>
                <div className="position-relative">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(gitCommands, 'git-push')}
                    className="btn btn-sm btn-outline-light rounded-pill py-0.5 px-2.5 d-flex align-items-center gap-1 position-absolute top-0 end-0 mt-2 me-2"
                    style={{ fontSize: '0.7rem', zIndex: 2 }}
                  >
                    {copiedKey === 'git-push' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                    <span>{copiedKey === 'git-push' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre 
                    className="p-3 bg-dark text-light rounded-3 mb-0 font-monospace overflow-x-auto" 
                    style={{ fontSize: '0.75rem', lineHeight: '1.45' }}
                  >
                    {gitCommands}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-bold text-dark small">Want to use GitHub Desktop?</div>
                  <small className="text-muted">
                    Download the project ZIP in Tab 3, extract it, and choose &quot;Add Existing Repository&quot; in GitHub Desktop.
                  </small>
                </div>
                <a
                  href="https://desktop.github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 text-decoration-none"
                  style={{ fontSize: '0.75rem' }}
                >
                  Get GitHub Desktop
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD COMPLETE ZIP */}
          {activeTab === 'download' && (
            <div className="d-flex flex-column gap-3">
              <div 
                className="p-4 rounded-3 border text-center d-flex flex-column align-items-center"
                style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-2 shadow-xs"
                  style={{ width: '48px', height: '48px', backgroundColor: 'var(--g-green)' }}
                >
                  <Download size={22} />
                </div>
                <h3 className="fs-6 fw-bold text-dark mb-1">
                  Complete GitHub &amp; Vercel Package (.zip)
                </h3>
                <p className="text-muted small mb-3" style={{ maxWidth: '520px' }}>
                  Includes full React + Vite frontend, Express backend, <code>vercel.json</code>, <code>README.md</code>, <code>package.json</code>, and all configuration files ready for deployment.
                </p>

                <a
                  href="/api/project/download-source"
                  download="b2b-lead-pro-repo.zip"
                  className="btn btn-g-green px-4 py-2.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-2 shadow-sm text-decoration-none"
                  style={{ fontSize: '0.88rem' }}
                >
                  <Download size={16} />
                  <span>Download Project Archive (.zip)</span>
                </a>
              </div>

              <div className="row g-2 text-muted" style={{ fontSize: '0.75rem' }}>
                <div className="col-12 col-sm-4">
                  <div className="p-2.5 bg-light rounded-3 border h-100">
                    <strong className="text-dark d-block mb-1">1. Extract ZIP</strong>
                    Unzip the archive to any folder on your computer.
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="p-2.5 bg-light rounded-3 border h-100">
                    <strong className="text-dark d-block mb-1">2. Push to GitHub</strong>
                    Run <code>git init &amp;&amp; git push</code> to push to your repository.
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="p-2.5 bg-light rounded-3 border h-100">
                    <strong className="text-dark d-block mb-1">3. Link Vercel</strong>
                    Import repository on Vercel Dashboard with 1 click!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-1.5 text-muted small" style={{ fontSize: '0.72rem' }}>
            <Sparkles size={13} className="text-warning" />
            <span>Production-ready full-stack repository configuration</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 bg-white"
            style={{ fontSize: '0.78rem' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
