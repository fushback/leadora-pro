import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  Building2,
  Check,
  Sparkles,
  Github,
  Cloud,
  Maximize2,
  Key,
  FolderGit2,
  Lock,
  Globe,
  ExternalLink,
  Copy,
  RefreshCw,
  GitCommit,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { UserProfile, saveStoredUserProfile } from '../utils/userProfile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  initialTab?: 'profile' | 'github-vercel';
  onNavigateToGitHubVercel?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Google Blue', value: '#1a73e8' },
  { label: 'Emerald Green', value: '#1e8e3e' },
  { label: 'Vibrant Red', value: '#ea4335' },
  { label: 'Warm Amber', value: '#f9ab00' },
  { label: 'Royal Purple', value: '#9334e8' },
  { label: 'Deep Slate', value: '#334155' }
];

const GITHUB_TOKEN_STORAGE_KEY = 'leadora_github_pat_v1';
const REPO_NAME_STORAGE_KEY = 'leadora_github_repo_v1';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  initialTab = 'profile',
  onNavigateToGitHubVercel
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'github-vercel'>(initialTab);

  // Profile Form State
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [company, setCompany] = useState(profile.company);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor || '#1a73e8');
  const [isSaved, setIsSaved] = useState(false);

  // GitHub / Vercel State
  const [gitToken, setGitToken] = useState<string>(() => localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || '');
  const [gitRepoName, setGitRepoName] = useState<string>(() => localStorage.getItem(REPO_NAME_STORAGE_KEY) || 'leadora-pro');
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [gitCommitMsg, setGitCommitMsg] = useState<string>('Deploy Leadora PRO lead intelligence app');
  const [showGitToken, setShowGitToken] = useState<boolean>(false);
  const [isVerifyingGit, setIsVerifyingGit] = useState<boolean>(false);
  const [verifiedGitUser, setVerifiedGitUser] = useState<{ login: string; avatar_url: string } | null>(null);
  const [isPushingGit, setIsPushingGit] = useState<boolean>(false);
  const [gitPushMessage, setGitPushMessage] = useState<{ type: 'success' | 'error'; text: string; repoUrl?: string; vercelUrl?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email);
      setRole(profile.role);
      setCompany(profile.company);
      setAvatarColor(profile.avatarColor || '#1a73e8');
      setIsSaved(false);
      setActiveTab(initialTab);
      setGitPushMessage(null);
    }
  }, [isOpen, profile, initialTab]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const updated = saveStoredUserProfile({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || 'Lead Generation Specialist',
      company: company.trim() || 'Leadora PRO Enterprise',
      avatarColor
    });

    onProfileUpdated(updated);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleVerifyGitToken = async () => {
    if (!gitToken.trim()) return;
    setIsVerifyingGit(true);
    setGitPushMessage(null);
    try {
      const res = await fetch('/api/github/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: gitToken.trim() })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedGitUser({ login: data.user.login, avatar_url: data.user.avatar_url });
        localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, gitToken.trim());
      } else {
        setVerifiedGitUser(null);
        setGitPushMessage({ type: 'error', text: data.error || 'Invalid GitHub token. Please verify scopes (needs "repo").' });
      }
    } catch (err: any) {
      setVerifiedGitUser(null);
      setGitPushMessage({ type: 'error', text: err.message || 'Could not connect to GitHub verification API.' });
    } finally {
      setIsVerifyingGit(false);
    }
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitToken.trim()) return;

    setIsPushingGit(true);
    setGitPushMessage(null);

    try {
      localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, gitToken.trim());
      localStorage.setItem(REPO_NAME_STORAGE_KEY, gitRepoName.trim());

      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gitToken.trim(),
          repoName: gitRepoName.trim(),
          isPrivate: isPrivateRepo,
          commitMessage: gitCommitMsg.trim() || 'Deploy Leadora PRO lead intelligence application'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to push to GitHub');
      }

      setGitPushMessage({
        type: 'success',
        text: `Successfully pushed codebase to GitHub!`,
        repoUrl: data.repoUrl,
        vercelUrl: data.vercelDeployUrl
      });
    } catch (err: any) {
      setGitPushMessage({
        type: 'error',
        text: err.message || 'Failed to push repository.'
      });
    } finally {
      setIsPushingGit(false);
    }
  };

  const initials = (name.trim() || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const activeRepo = gitPushMessage?.repoUrl || (verifiedGitUser ? `https://github.com/${verifiedGitUser.login}/${gitRepoName}` : '');
  const vercelOneClickLink = gitPushMessage?.vercelUrl || (activeRepo ? `https://vercel.com/new/clone?repository-url=${encodeURIComponent(activeRepo)}&env=GEMINI_API_KEY,GOOGLE_MAPS_API_KEY&project-name=${encodeURIComponent(gitRepoName)}` : 'https://vercel.com/new');

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: activeTab === 'github-vercel' ? '560px' : '480px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* Top Modal Header */}
          <div className="modal-header border-bottom py-3 px-4 bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs flex-shrink-0"
                style={{ width: '38px', height: '38px', backgroundColor: avatarColor, fontSize: '0.9rem' }}
              >
                {initials}
              </div>
              <div>
                <h6 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1rem', letterSpacing: '-0.2px' }}>
                  User Profile &amp; Settings
                </h6>
                <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                  Manage identity and GitHub/Vercel cloud deployment
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

          {/* Modal Tab Switcher */}
          <div className="px-4 pt-2.5 pb-2 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-1.5 p-1 bg-white rounded-3 border">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`btn btn-sm py-1 px-3 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  activeTab === 'profile'
                    ? 'btn-primary text-white shadow-2xs'
                    : 'text-secondary hover-text-dark bg-transparent border-0'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                <User size={13} />
                <span>Profile Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('github-vercel')}
                className={`btn btn-sm py-1 px-3 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  activeTab === 'github-vercel'
                    ? 'btn-dark text-white shadow-2xs'
                    : 'text-secondary hover-text-dark bg-transparent border-0'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                <Github size={13} />
                <span>GitHub/Vercel</span>
              </button>
            </div>

            {/* Quick link to open in new full page */}
            {activeTab === 'github-vercel' && onNavigateToGitHubVercel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToGitHubVercel();
                }}
                className="btn btn-sm btn-outline-dark py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '0.74rem' }}
                title="Open GitHub & Vercel in full dedicated page"
              >
                <Maximize2 size={12} />
                <span>Open as New Page</span>
              </button>
            )}
          </div>

          {/* TAB 1: USER PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-3.5 rounded-3 border mb-3">
                  
                  {/* Avatar Color Swatch Picker */}
                  <div className="mb-3">
                    <label className="form-label text-dark small fw-semibold mb-1.5" style={{ fontSize: '0.8rem' }}>
                      Profile Avatar Accent
                    </label>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setAvatarColor(c.value)}
                          className="rounded-circle border-0 position-relative p-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: c.value,
                            outline: avatarColor === c.value ? `3px solid ${c.value}40` : 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                          title={c.label}
                        >
                          {avatarColor === c.value && <Check size={14} className="text-white fw-bold" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="mb-3">
                    <label htmlFor="user-name" className="form-label text-dark small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                        <User size={15} />
                      </span>
                      <input
                        id="user-name"
                        type="text"
                        className="form-control border-start-0 ps-1"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ashis Mehta"
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="mb-3">
                    <label htmlFor="user-email" className="form-label text-dark small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                        <Mail size={15} />
                      </span>
                      <input
                        id="user-email"
                        type="email"
                        className="form-control border-start-0 ps-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ashis@example.com"
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Role / Title */}
                  <div className="mb-3">
                    <label htmlFor="user-role" className="form-label text-dark small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Role / Title
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                        <Briefcase size={15} />
                      </span>
                      <input
                        id="user-role"
                        type="text"
                        className="form-control border-start-0 ps-1"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Lead Specialist / VP Growth"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Organization / Company */}
                  <div>
                    <label htmlFor="user-company" className="form-label text-dark small fw-semibold mb-1" style={{ fontSize: '0.8rem' }}>
                      Organization / Agency
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2.5">
                        <Building2 size={15} />
                      </span>
                      <input
                        id="user-company"
                        type="text"
                        className="form-control border-start-0 ps-1"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Leadora Global Enterprise"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                </div>

                {isSaved && (
                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 rounded-3 mb-0" style={{ fontSize: '0.8rem' }}>
                    <Sparkles size={16} className="text-success flex-shrink-0" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}
              </div>

              {/* Profile Footer */}
              <div className="modal-footer bg-white border-top py-2.5 px-4 d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-light border px-3 rounded-pill fw-semibold"
                  onClick={onClose}
                  style={{ fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim() || isSaved}
                  className="btn btn-sm btn-primary text-white px-3.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                  style={{ fontSize: '0.82rem', backgroundColor: '#1A73E8' }}
                >
                  <Check size={14} />
                  <span>{isSaved ? 'Saved!' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: GITHUB / VERCEL FEATURE */}
          {activeTab === 'github-vercel' && (
            <div>
              <div className="modal-body p-3.5 p-sm-4 bg-light" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* Feature Header Banner */}
                <div className="p-3 bg-white rounded-3 border mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="rounded-2 d-flex align-items-center justify-content-center text-white p-2" style={{ backgroundColor: '#000000' }}>
                      <Github size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                        GitHub &amp; Vercel Deployment
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                        Push code to GitHub &amp; deploy to Vercel in 1 click
                      </div>
                    </div>
                  </div>

                  {onNavigateToGitHubVercel && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToGitHubVercel();
                      }}
                      className="btn btn-sm btn-dark text-white rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-2xs"
                      style={{ fontSize: '0.74rem' }}
                    >
                      <Maximize2 size={12} />
                      <span>Full Page View</span>
                    </button>
                  )}
                </div>

                {/* Form to Push to GitHub */}
                <form onSubmit={handlePushToGitHub} className="bg-white p-3.5 rounded-3 border mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom">
                    <span className="fw-bold text-dark small d-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                      <FolderGit2 size={14} className="text-primary" />
                      <span>Push to GitHub</span>
                    </span>
                    {verifiedGitUser && (
                      <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill" style={{ fontSize: '0.68rem' }}>
                        @{verifiedGitUser.login}
                      </span>
                    )}
                  </div>

                  {/* GitHub Token */}
                  <div className="mb-2.5">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label text-dark fw-semibold mb-0" style={{ fontSize: '0.78rem' }}>
                        GitHub Personal Access Token (PAT) <span className="text-danger">*</span>
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Leadora%20PRO"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none small d-inline-flex align-items-center gap-0.5"
                        style={{ fontSize: '0.7rem' }}
                      >
                        <span>Generate Token</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted px-2">
                        <Key size={14} />
                      </span>
                      <input
                        type={showGitToken ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0 ps-1 font-monospace"
                        value={gitToken}
                        onChange={(e) => setGitToken(e.target.value)}
                        placeholder="ghp_xxxx or github_pat_xxxx"
                        required
                        style={{ fontSize: '0.8rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGitToken(!showGitToken)}
                        className="btn btn-outline-secondary border-start-0 border-end-0 bg-white text-muted px-2"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {showGitToken ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        disabled={isVerifyingGit || !gitToken.trim()}
                        onClick={handleVerifyGitToken}
                        className="btn btn-light border px-2.5 text-secondary"
                        style={{ fontSize: '0.74rem' }}
                      >
                        {isVerifyingGit ? <RefreshCw size={12} className="animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {/* Repo Name & Privacy */}
                  <div className="row g-2 mb-2.5">
                    <div className="col-7">
                      <label className="form-label text-dark fw-semibold mb-1" style={{ fontSize: '0.78rem' }}>
                        Repository Name
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={gitRepoName}
                        onChange={(e) => setGitRepoName(e.target.value)}
                        placeholder="leadora-pro"
                        required
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label text-dark fw-semibold mb-1" style={{ fontSize: '0.78rem' }}>
                        Privacy
                      </label>
                      <div className="d-flex align-items-center gap-1 p-0.5 bg-light rounded border">
                        <button
                          type="button"
                          onClick={() => setIsPrivateRepo(false)}
                          className={`btn btn-sm flex-grow-1 py-1 px-1 rounded border-0 ${
                            !isPrivateRepo ? 'bg-white text-dark shadow-2xs fw-bold' : 'text-muted'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          Public
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPrivateRepo(true)}
                          className={`btn btn-sm flex-grow-1 py-1 px-1 rounded border-0 ${
                            isPrivateRepo ? 'bg-white text-dark shadow-2xs fw-bold' : 'text-muted'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          Private
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Push Button */}
                  <button
                    type="submit"
                    disabled={isPushingGit || !gitToken.trim() || !gitRepoName.trim()}
                    className="btn btn-dark w-100 py-2 rounded-2 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 shadow-2xs mt-1"
                    style={{ fontSize: '0.82rem', backgroundColor: '#0F172A' }}
                  >
                    {isPushingGit ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Pushing Code to GitHub...</span>
                      </>
                    ) : (
                      <>
                        <Github size={14} />
                        <span>Push to GitHub</span>
                      </>
                    )}
                  </button>

                  {/* Inline Message Feedback */}
                  {gitPushMessage && (
                    <div
                      className={`alert mt-2.5 p-2 rounded-2 ${
                        gitPushMessage.type === 'success' ? 'alert-success' : 'alert-danger'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <div className="fw-semibold mb-1">{gitPushMessage.text}</div>
                      {gitPushMessage.repoUrl && (
                        <a
                          href={gitPushMessage.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-inline-flex align-items-center gap-1 text-success fw-bold text-decoration-underline"
                        >
                          <span>{gitPushMessage.repoUrl}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </form>

                {/* ONE CLICK HOSTING FROM GITHUB TO VERCEL */}
                <div className="bg-white p-3.5 rounded-3 border">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom">
                    <span className="fw-bold text-dark small d-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                      <svg width="12" height="12" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#000000" />
                      </svg>
                      <span>One-Click Hosting on Vercel</span>
                    </span>
                    <span className="badge bg-dark text-white rounded-pill" style={{ fontSize: '0.65rem' }}>
                      Instant Live URL
                    </span>
                  </div>

                  <p className="text-secondary small mb-2.5" style={{ fontSize: '0.75rem' }}>
                    Deploy your pushed repository to Vercel global CDN with automated builds (<code>vite build</code> + Express API).
                  </p>

                  <a
                    href={vercelOneClickLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark w-100 py-2 rounded-pill fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-xs"
                    style={{ backgroundColor: '#000000', fontSize: '0.82rem' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" />
                    </svg>
                    <span>One-Click Deploy to Vercel</span>
                    <ExternalLink size={12} />
                  </a>

                  {/* Copy Env Vars Helper */}
                  <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between">
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Requires <code>GEMINI_API_KEY</code> in Vercel
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const envs = 'GEMINI_API_KEY=\nGOOGLE_MAPS_API_KEY=\nNODE_ENV=production';
                        copyToClipboard(envs, 'Vercel Env Vars');
                      }}
                      className="btn btn-link text-primary p-0 text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {copiedKey === 'Vercel Env Vars' ? <Check size={12} /> : <Copy size={12} />}
                      <span>Copy Env Template</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer for Tab 2 */}
              <div className="modal-footer bg-white border-top py-2.5 px-4 d-flex align-items-center justify-content-between">
                {onNavigateToGitHubVercel ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToGitHubVercel();
                    }}
                    className="btn btn-sm btn-link text-dark text-decoration-none p-0 d-inline-flex align-items-center gap-1 fw-semibold"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Maximize2 size={13} />
                    <span>Open full deployment console</span>
                  </button>
                ) : <span />}

                <button
                  type="button"
                  className="btn btn-sm btn-light border px-3 rounded-pill fw-semibold"
                  onClick={onClose}
                  style={{ fontSize: '0.82rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
