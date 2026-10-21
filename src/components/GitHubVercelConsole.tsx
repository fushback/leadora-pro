import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Copy,
  Check,
  Cloud,
  Terminal,
  ShieldCheck,
  Sparkles,
  Lock,
  Globe,
  Key,
  FolderGit2,
  RefreshCw,
  GitCommit,
  GitBranch,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface GitHubVercelConsoleProps {
  onBack: () => void;
  onToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  email?: string;
  public_repos?: number;
}

const GITHUB_TOKEN_STORAGE_KEY = 'leadora_github_pat_v1';
const REPO_NAME_STORAGE_KEY = 'leadora_github_repo_v1';

export const GitHubVercelConsole: React.FC<GitHubVercelConsoleProps> = ({ onBack, onToast }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || '');
  const [repoName, setRepoName] = useState<string>(() => localStorage.getItem(REPO_NAME_STORAGE_KEY) || 'leadora-pro');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('Initial commit: Leadora PRO B2B lead intelligence platform');
  const [showToken, setShowToken] = useState<boolean>(false);

  // Verification & Status State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedUser, setVerifiedUser] = useState<GitHubUser | null>(null);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [pushResult, setPushResult] = useState<{
    repoUrl: string;
    cloneUrl: string;
    commitSha: string;
    branch: string;
    vercelDeployUrl: string;
  } | null>(null);

  // Vercel State
  const [vercelToken, setVercelToken] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-verify token if already stored
  useEffect(() => {
    if (token && token.trim().length > 10) {
      verifyToken(token.trim(), false);
    }
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${key} copied successfully.`
    });
  };

  const verifyToken = async (pat: string, notify = true) => {
    if (!pat.trim()) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/github/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pat.trim() })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedUser(data.user);
        localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, pat.trim());
        if (notify) {
          onToast({
            type: 'success',
            title: 'GitHub Verified',
            message: `Authenticated as @${data.user.login}`
          });
        }
      } else {
        setVerifiedUser(null);
        if (notify) {
          onToast({
            type: 'error',
            title: 'Authentication Failed',
            message: data.error || 'Invalid GitHub token. Please check your token scopes.'
          });
        }
      }
    } catch (err: any) {
      setVerifiedUser(null);
      if (notify) {
        onToast({
          type: 'error',
          title: 'Verification Error',
          message: err.message || 'Could not connect to GitHub verification service.'
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePushToGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token.trim()) {
      onToast({
        type: 'warning',
        title: 'Token Required',
        message: 'Please provide a GitHub Personal Access Token to push your code.'
      });
      return;
    }

    setIsPushing(true);
    setPushLogs([
      '🔍 Authenticating credentials with GitHub API...',
      '📦 Scanning local workspace files (filtering dependencies & secrets)...',
      '🌱 Initializing Git repository and checking branch configuration...'
    ]);

    try {
      localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token.trim());
      localStorage.setItem(REPO_NAME_STORAGE_KEY, repoName.trim());

      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          repoName: repoName.trim(),
          isPrivate,
          commitMessage: commitMessage.trim() || 'feat: deploy Leadora PRO platform'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to push codebase to GitHub');
      }

      setPushLogs((prev) => [
        ...prev,
        '✨ Repository verified/created on GitHub!',
        `📝 Staged all application source files & configuration`,
        `🚀 Pushed main branch to ${data.repoUrl}`,
        `✅ Deployment ready! Vercel one-click hosting link generated.`
      ]);

      setPushResult({
        repoUrl: data.repoUrl,
        cloneUrl: data.cloneUrl,
        commitSha: data.commitSha,
        branch: data.branch,
        vercelDeployUrl: data.vercelDeployUrl
      });

      onToast({
        type: 'success',
        title: 'Pushed to GitHub Successfully!',
        message: `Your codebase is live at ${data.repoUrl}`
      });
    } catch (err: any) {
      setPushLogs((prev) => [
        ...prev,
        `❌ Push error: ${err.message}`
      ]);
      onToast({
        type: 'error',
        title: 'Push Failed',
        message: err.message || 'Could not complete push to GitHub.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const activeRepoUrl = pushResult?.repoUrl || (verifiedUser ? `https://github.com/${verifiedUser.login}/${repoName}` : '');
  const oneClickVercelUrl = pushResult?.vercelDeployUrl || (activeRepoUrl ? `https://vercel.com/new/clone?repository-url=${encodeURIComponent(activeRepoUrl)}&env=GEMINI_API_KEY,GOOGLE_MAPS_API_KEY&project-name=${encodeURIComponent(repoName)}` : 'https://vercel.com/new');

  return (
    <div className="container-xl px-2 px-sm-3 px-lg-4 py-3">
      {/* Top Navigation & Back Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-3 border-bottom">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 fw-semibold"
          style={{ fontSize: '0.82rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Workspace</span>
        </button>

        <div className="d-flex align-items-center gap-2">
          <span className="badge badge-g-blue rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
            <Cloud size={12} />
            <span>GitHub &amp; Vercel Cloud Hub</span>
          </span>
          <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
            <Sparkles size={12} className="text-warning" />
            <span>1-Click Deploy</span>
          </span>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white position-relative">
        <div className="quad-gradient-line" />
        <div className="p-3.5 p-sm-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-8">
              <div className="d-flex align-items-center gap-2.5 mb-2">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
                  style={{ width: '42px', height: '42px', backgroundColor: '#0F172A' }}
                >
                  <Github size={22} />
                </div>
                <div>
                  <h1 className="h5 fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px' }}>
                    Push to GitHub &amp; One-Click Vercel Hosting
                  </h1>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Publish this entire B2B Lead Intelligence application to your GitHub repository and host on Vercel with zero friction.
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4 text-md-end">
              {pushResult && (
                <a
                  href={pushResult.vercelDeployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-dark text-white rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                  style={{ fontSize: '0.84rem', backgroundColor: '#000000' }}
                >
                  <svg width="14" height="14" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" />
                  </svg>
                  <span>One-Click Deploy to Vercel</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Step 1 (Push to GitHub) and Step 2 (Vercel Hosting) */}
      <div className="row g-3 g-lg-4">
        
        {/* ================= STEP 1: PUSH TO GITHUB ================= */}
        <div className="col-12 col-lg-7">
          <div className="card border rounded-4 shadow-xs h-100 bg-white">
            <div className="card-header bg-white border-bottom p-3.5 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-2 d-flex align-items-center justify-content-center text-white shadow-2xs"
                  style={{ width: '30px', height: '30px', backgroundColor: '#24292F' }}
                >
                  <Github size={16} />
                </div>
                <div>
                  <h2 className="fs-6 fw-bold text-dark mb-0" style={{ fontSize: '0.92rem' }}>
                    Step 1: Push Codebase to GitHub
                  </h2>
                  <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Creates repo automatically &amp; commits all application files
                  </div>
                </div>
              </div>

              {verifiedUser ? (
                <div className="d-flex align-items-center gap-1.5 bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                  <img
                    src={verifiedUser.avatar_url}
                    alt={verifiedUser.login}
                    className="rounded-circle"
                    style={{ width: '16px', height: '16px' }}
                  />
                  <strong>@{verifiedUser.login}</strong>
                  <ShieldCheck size={13} className="text-success ms-0.5" />
                </div>
              ) : (
                <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
                  Token Required
                </span>
              )}
            </div>

            <div className="card-body p-3.5 p-sm-4">
              <form onSubmit={handlePushToGitHub}>
                
                {/* 1. GitHub Personal Access Token Input */}
                <div className="mb-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label text-dark fw-semibold mb-0" style={{ fontSize: '0.8rem' }}>
                      GitHub Personal Access Token (PAT) <span className="text-danger">*</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Leadora%20PRO%20Deploy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none small d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '0.73rem' }}
                    >
                      <span>Create Token on GitHub</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                      <Key size={15} />
                    </span>
                    <input
                      type={showToken ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 ps-1"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                      required
                      style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="btn btn-outline-secondary border-start-0 border-end-0 bg-white text-muted px-2.5"
                      style={{ fontSize: '0.74rem' }}
                      title={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      disabled={isVerifying || !token.trim()}
                      onClick={() => verifyToken(token, true)}
                      className="btn btn-light border px-3 d-inline-flex align-items-center gap-1 text-secondary"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {isVerifying ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>{verifiedUser ? 'Verified' : 'Verify'}</span>
                    </button>
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    Tip: Needs the <code>repo</code> scope so it can create and push code to your account.
                  </div>
                </div>

                {/* 2. Repository Name and Privacy */}
                <div className="row g-2.5 mb-3.5">
                  <div className="col-12 col-sm-8">
                    <label className="form-label text-dark fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Repository Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                        <FolderGit2 size={15} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-1 font-monospace"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="e.g. leadora-pro"
                        required
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <label className="form-label text-dark fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Repository Privacy
                    </label>
                    <div className="d-flex align-items-center gap-1 p-1 bg-light rounded-2 border">
                      <button
                        type="button"
                        onClick={() => setIsPrivate(false)}
                        className={`btn btn-sm flex-grow-1 py-1 px-2 rounded-2 border-0 transition-all ${
                          !isPrivate ? 'bg-white text-dark shadow-2xs fw-semibold' : 'text-muted bg-transparent'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        <Globe size={12} className="me-1 text-success" />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPrivate(true)}
                        className={`btn btn-sm flex-grow-1 py-1 px-2 rounded-2 border-0 transition-all ${
                          isPrivate ? 'bg-white text-dark shadow-2xs fw-semibold' : 'text-muted bg-transparent'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        <Lock size={12} className="me-1 text-amber-500" />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Commit Message */}
                <div className="mb-3.5">
                  <label className="form-label text-dark fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                    Commit Message
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                      <GitCommit size={15} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-1"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="e.g. Initial commit: Leadora PRO B2B lead app"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Push Action Button */}
                <button
                  type="submit"
                  disabled={isPushing || !token.trim() || !repoName.trim()}
                  className="btn btn-dark w-100 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-xs transition-all"
                  style={{
                    backgroundColor: isPushing ? '#334155' : '#0F172A',
                    fontSize: '0.86rem'
                  }}
                >
                  {isPushing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Packaging &amp; Pushing to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <Github size={16} />
                      <span>Verify &amp; Push to GitHub</span>
                    </>
                  )}
                </button>
              </form>

              {/* Push Progress Logs */}
              {pushLogs.length > 0 && (
                <div className="mt-3.5 p-3 rounded-3 bg-slate-900 text-slate-100 font-monospace" style={{ fontSize: '0.74rem' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1.5 pb-1 border-bottom border-slate-700">
                    <span className="text-slate-400 fw-bold d-flex align-items-center gap-1.5">
                      <Terminal size={13} className="text-emerald-400" />
                      <span>Git Operation Log</span>
                    </span>
                    <span className="badge bg-slate-800 text-slate-300 font-monospace" style={{ fontSize: '0.65rem' }}>
                      main
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-1" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {pushLogs.map((log, index) => (
                      <div key={index} className="text-truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Push Result Success Box */}
              {pushResult && (
                <div className="alert alert-success mt-3 p-3 rounded-3 border-success-subtle bg-success-subtle text-success-emphasis">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Check size={16} className="text-success" />
                      <strong style={{ fontSize: '0.82rem' }}>Repository Successfully Published!</strong>
                    </div>
                    <a
                      href={pushResult.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success py-0.5 px-2.5 rounded-pill d-inline-flex align-items-center gap-1 bg-white"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <span>View on GitHub</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="bg-white p-2 rounded-2 border border-success-subtle font-monospace text-dark d-flex align-items-center justify-content-between" style={{ fontSize: '0.74rem' }}>
                    <span className="text-truncate me-2">{pushResult.repoUrl}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pushResult.repoUrl, 'Repository URL')}
                      className="btn btn-sm btn-light p-1 rounded border-0 text-muted"
                      title="Copy URL"
                    >
                      {copiedKey === 'Repository URL' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ================= STEP 2: ONE-CLICK VERCEL HOSTING ================= */}
        <div className="col-12 col-lg-5">
          <div className="card border rounded-4 shadow-xs h-100 bg-white">
            <div className="card-header bg-white border-bottom p-3.5 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-2 d-flex align-items-center justify-content-center text-white shadow-2xs"
                  style={{ width: '30px', height: '30px', backgroundColor: '#000000' }}
                >
                  <svg width="14" height="14" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" />
                  </svg>
                </div>
                <div>
                  <h2 className="fs-6 fw-bold text-dark mb-0" style={{ fontSize: '0.92rem' }}>
                    Step 2: One-Click Vercel Hosting
                  </h2>
                  <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Instant cloud hosting with continuous deployment
                  </div>
                </div>
              </div>

              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1" style={{ fontSize: '0.7rem' }}>
                Vite + Node Server
              </span>
            </div>

            <div className="card-body p-3.5 p-sm-4 d-flex flex-column justify-content-between">
              <div>
                <p className="text-secondary small mb-3" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Once your code is in GitHub, Vercel connects automatically to your repository, configures the build command (<code>vite build</code>), and provisions high-speed global CDN hosting with an SSL certificate.
                </p>

                {/* Primary Vercel One-Click Deploy Banner */}
                <div className="p-3.5 rounded-3 border bg-slate-50 text-center mb-3">
                  <div className="d-flex justify-content-center mb-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                      style={{ width: '48px', height: '48px', backgroundColor: '#000000' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="fs-6 fw-bold text-dark mb-1">
                    Instant 1-Click Hosting
                  </h3>
                  <p className="text-muted small mb-3" style={{ fontSize: '0.75rem' }}>
                    Imports repository directly into your Vercel team dashboard
                  </p>

                  <a
                    href={oneClickVercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark w-100 py-2.5 rounded-pill fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-xs"
                    style={{ backgroundColor: '#000000', fontSize: '0.84rem' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" />
                    </svg>
                    <span>Deploy to Vercel in 1-Click</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Required Environment Variables Table */}
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="fw-semibold text-dark small" style={{ fontSize: '0.78rem' }}>
                      Vercel Environment Variables:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const envContent = `GEMINI_API_KEY=\nGOOGLE_MAPS_API_KEY=\nNODE_ENV=production`;
                        copyToClipboard(envContent, 'Environment Variables');
                      }}
                      className="btn btn-link text-primary p-0 text-decoration-none small fw-semibold d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {copiedKey === 'Environment Variables' ? <Check size={12} /> : <Copy size={12} />}
                      <span>Copy Template</span>
                    </button>
                  </div>

                  <div className="border rounded-3 overflow-hidden bg-white">
                    <div className="p-2 border-bottom d-flex align-items-center justify-content-between bg-light" style={{ fontSize: '0.72rem' }}>
                      <span className="font-monospace fw-bold text-dark">GEMINI_API_KEY</span>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Required</span>
                    </div>
                    <div className="p-2 border-bottom d-flex align-items-center justify-content-between" style={{ fontSize: '0.72rem' }}>
                      <span className="font-monospace fw-bold text-dark">GOOGLE_MAPS_API_KEY</span>
                      <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">Recommended</span>
                    </div>
                    <div className="p-2 d-flex align-items-center justify-content-between bg-light" style={{ fontSize: '0.72rem' }}>
                      <span className="font-monospace fw-bold text-dark">NODE_ENV</span>
                      <span className="badge bg-secondary-subtle text-secondary border">production</span>
                    </div>
                  </div>
                </div>

                {/* Configuration Specs */}
                <div className="p-2.5 rounded-2 bg-light border text-muted" style={{ fontSize: '0.72rem', lineHeight: 1.45 }}>
                  <div className="d-flex align-items-center gap-1.5 mb-1 text-dark fw-semibold">
                    <Check size={13} className="text-success" />
                    <span>Pre-configured vercel.json included</span>
                  </div>
                  <div>Build command: <code>vite build</code></div>
                  <div>Output directory: <code>dist</code></div>
                  <div>API routes: Express serverless rewrite to <code>/api</code></div>
                </div>
              </div>

              {/* Direct Download Backup */}
              <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between">
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Prefer manual deployment?</span>
                <a
                  href="/api/project/download-source"
                  className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 rounded-pill d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.72rem' }}
                >
                  <span>Download .zip</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
