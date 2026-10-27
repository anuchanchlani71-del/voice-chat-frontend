import React, { useState } from 'react';
import { useNavigate } from '../router';
import { IconMic } from '../components/common/Icons';
import { adminLogin, setAdminToken } from '../services/adminApi';

/* ---------------------------------------------------------------
   Admin Login Page
   Connected to: POST /api/v1/admin/auth/login
   Token stored in: localStorage ('adminToken')
   On success: redirects to /dashboard
--------------------------------------------------------------- */

// Eye icon — inline SVG so no new icon file is needed
function IconEyeOn({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconLock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(''); // server-returned error message

  // ── Validation helpers ──────────────────────────────────────
  const isEmailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;

  const emailError = emailTouched && !isEmailValid
    ? (email.trim().length === 0 ? 'Email is required.' : 'Enter a valid email address.')
    : null;

  const passwordError = passwordTouched && !isPasswordValid
    ? (password.length === 0 ? 'Password is required.' : 'Password must be at least 6 characters.')
    : null;

  const canSubmit = isEmailValid && isPasswordValid;

  // ── Submit handler — calls POST /api/v1/admin/auth/login ────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setApiError(''); // clear any previous server error

    if (!canSubmit) return;
    if (isLoading) return; // prevent duplicate submissions

    setIsLoading(true);
    try {
      const data = await adminLogin(email.trim(), password);
      // Store JWT token
      setAdminToken(data.token);
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Show the server's error message inline on the form
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* ── Ambient background blobs ─────────────────────────── */}
      <div style={styles.blobTopLeft} aria-hidden="true" />
      <div style={styles.blobBottomRight} aria-hidden="true" />

      {/* ── Login Card ──────────────────────────────────────── */}
      <div style={styles.card}>

        {/* Brand header */}
        <div style={styles.brandRow}>
          <div className="brand-icon" style={{ width: 52, height: 52, borderRadius: 16 }}>
            <IconMic size={22} />
          </div>
          <div style={styles.brandText}>
            <span style={styles.brandTitle}>Voice Chat</span>
            <span style={styles.brandSubtitle}>&amp; Friends · Admin</span>
          </div>
        </div>

        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>Admin Login</h1>
          <p style={styles.subheading}>
            Sign in to access the Admin Panel
          </p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>

          {/* Email field */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label htmlFor="admin-email" className="form-label">
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <span style={{
                ...styles.inputIcon,
                color: emailError ? 'var(--danger-500)' : (emailTouched && isEmailValid ? 'var(--success-500)' : 'var(--accent-color)')
              }}>
                <IconMail size={16} />
              </span>
              <input
                id="admin-email"
                type="email"
                className="input-control"
                placeholder="admin@voicefriends.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                autoComplete="email"
                style={{
                  paddingLeft: 38,
                  borderColor: emailError
                    ? 'var(--danger-500)'
                    : (emailTouched && isEmailValid ? 'var(--success-500)' : undefined),
                  boxShadow: emailError
                    ? '0 0 0 3px rgba(239,68,68,0.15)'
                    : (emailTouched && isEmailValid ? '0 0 0 3px rgba(16,185,129,0.12)' : undefined)
                }}
              />
            </div>
            {emailError && (
              <div style={styles.fieldError}>{emailError}</div>
            )}
          </div>

          {/* Password field */}
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <span style={{
                ...styles.inputIcon,
                color: passwordError ? 'var(--danger-500)' : (passwordTouched && isPasswordValid ? 'var(--success-500)' : 'var(--accent-color)')
              }}>
                <IconLock size={16} />
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                autoComplete="current-password"
                style={{
                  paddingLeft: 38,
                  paddingRight: 44,
                  borderColor: passwordError
                    ? 'var(--danger-500)'
                    : (passwordTouched && isPasswordValid ? 'var(--success-500)' : undefined),
                  boxShadow: passwordError
                    ? '0 0 0 3px rgba(239,68,68,0.15)'
                    : (passwordTouched && isPasswordValid ? '0 0 0 3px rgba(16,185,129,0.12)' : undefined)
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showHideBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff size={17} /> : <IconEyeOn size={17} />}
              </button>
            </div>
            {passwordError && (
              <div style={styles.fieldError}>{passwordError}</div>
            )}
          </div>

          {/* Submit button */}
          {/* ── API / server error banner ────────────────────── */}
          {apiError && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.30)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--danger-700)',
              fontWeight: 500,
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
              {apiError}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              letterSpacing: '0.01em',
              opacity: isLoading ? 0.8 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Signing in…
              </>
            ) : (
              <>
                Sign In to Admin Panel
                <IconArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div style={styles.footerNote}>
          <span style={styles.lockIcon}><IconLock size={13} /></span>
          Secure admin access only &mdash; not for general users
        </div>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            style={{
              fontSize: 12,
              color: 'var(--accent-color-light)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            &larr; Back to Voice Friends App
          </a>
        </div>
      </div>

      {/* Phase badge */}
      <div style={styles.phaseBadge}>
        Phase 1 MVP &middot; v1.0
      </div>
    </div>
  );
}

/* ── Inline loading spinner ─────────────────────────────────── */
function LoadingSpinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 16,
      height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'login-spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },

  blobTopLeft: {
    position: 'fixed',
    top: '-120px',
    left: '-120px',
    width: '520px',
    height: '520px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(135,124,169,0.22) 0%, rgba(107,96,140,0.10) 50%, transparent 80%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  blobBottomRight: {
    position: 'fixed',
    bottom: '-100px',
    right: '-100px',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(135,124,169,0.14) 0%, rgba(68,58,89,0.06) 60%, transparent 85%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 440,
    background: 'linear-gradient(160deg, #1c162e 0%, #120e20 55%, #0c0915 100%)',
    border: '1px solid rgba(135,124,169,0.28)',
    borderRadius: 24,
    padding: '40px 36px 32px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(135,124,169,0.18)',
    backdropFilter: 'blur(20px)',
    boxSizing: 'border-box',
  },

  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },

  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },

  brandTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },

  brandSubtitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    color: 'var(--accent-color-light)',
    marginTop: 1,
  },

  headingBlock: {
    marginBottom: 24,
  },

  heading: {
    fontSize: 26,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    marginBottom: 6,
  },

  subheading: {
    fontSize: 13.5,
    color: '#9396af',
    lineHeight: 1.5,
  },

  divider: {
    height: 1,
    background: 'rgba(135,124,169,0.15)',
    marginBottom: 28,
  },

  form: {
    width: '100%',
  },

  inputWrapper: {
    position: 'relative',
    width: '100%',
  },

  inputIcon: {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
    zIndex: 1,
  },

  showHideBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#9396af',
    cursor: 'pointer',
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 6,
    transition: 'color 0.15s',
    outline: 'none',
    zIndex: 1,
  },

  fieldError: {
    fontSize: 12,
    color: 'var(--danger-700)',
    marginTop: 5,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
  },

  footerNote: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 12,
    color: '#636780',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.5,
  },

  lockIcon: {
    color: '#4e3d70',
    display: 'flex',
    alignItems: 'center',
  },
};

/* styles.phaseBadge inline object added below */
Object.assign(styles, {
  phaseBadge: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 11,
    fontWeight: 600,
    color: '#4e3d70',
    background: 'rgba(20,16,36,0.72)',
    border: '1px solid rgba(135,124,169,0.14)',
    padding: '5px 14px',
    borderRadius: 9999,
    letterSpacing: '0.05em',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 5,
  }
});
