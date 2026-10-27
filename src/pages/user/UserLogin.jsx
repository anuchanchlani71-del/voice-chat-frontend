import React, { useState } from 'react';
import { useNavigate, Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import { IconMic } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';

export default function UserLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Validation
  const identifierError = touched.identifier && !identifier.trim()
    ? 'Email or username is required'
    : null;

  const passwordError = touched.password && !password
    ? 'Password is required'
    : null;

  const canSubmit = identifier.trim().length > 0 && password.length >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    setApiError('');
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (res?.user?.isOnboarded) {
        navigate('/discover');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setApiError(err.message || 'Invalid credentials. Please check your username/email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserLayout>
      <AuthCard
        icon={<IconMic size={26} />}
        badgeText="Voice Social Community"
        title="Welcome Back"
        subtitle="Sign in to your Voice Friends account to join live rooms and call your friends."
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Email / Username */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Email Address or Username
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. alex@example.com or alex_vibes"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, identifier: true }))}
              style={{
                borderColor: identifierError ? 'var(--user-status-error)' : 'var(--user-border)',
                background: 'var(--user-bg-secondary)',
                color: 'var(--user-text)'
              }}
            />
            {identifierError && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {identifierError}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ color: 'var(--user-text)', margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--user-accent)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                style={{
                  paddingRight: 44,
                  borderColor: passwordError ? 'var(--user-status-error)' : 'var(--user-border)',
                  background: 'var(--user-bg-secondary)',
                  color: 'var(--user-text)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--user-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: 4
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwordError && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {passwordError}
              </div>
            )}
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <input
              type="checkbox"
              id="user-remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--user-primary)', cursor: 'pointer', width: 16, height: 16 }}
            />
            <label htmlFor="user-remember-me" style={{ fontSize: '0.84rem', color: 'var(--user-text-secondary)', cursor: 'pointer' }}>
              Keep me signed in on this device
            </label>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FB7185',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.84rem',
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: 500
            }}>
              {apiError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-user-primary"
            disabled={isLoading}
            style={{ marginBottom: 20 }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid var(--user-border)',
          paddingTop: 18,
          fontSize: '0.88rem',
          color: 'var(--user-text-secondary)'
        }}>
          Don&rsquo;t have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--user-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Create one free &rarr;
          </Link>
        </div>

        {/* Forgot Password Modal Simulation */}
        {showForgotModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 11, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}>
            <div style={{
              background: 'var(--user-bg-card)',
              border: '1px solid var(--user-border)',
              borderRadius: 18,
              padding: 28,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--user-text)' }}>Reset Password</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--user-text-secondary)', marginBottom: 18 }}>
                Enter your registered email address and we&rsquo;ll send you a password reset link.
              </p>

              {forgotSent ? (
                <div style={{
                  background: 'rgba(74, 222, 128, 0.12)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  color: '#4ADE80',
                  padding: 14,
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  marginBottom: 16
                }}>
                  Reset instructions have been sent to <strong>{forgotEmail}</strong> (Demo simulation).
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label" style={{ color: 'var(--user-text)' }}>Email Address</label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{
                      background: 'var(--user-bg-secondary)',
                      borderColor: 'var(--user-border)',
                      color: 'var(--user-text)'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                >
                  Close
                </button>
                {!forgotSent && (
                  <button
                    type="button"
                    className="btn-user-primary"
                    style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                    onClick={() => {
                      if (forgotEmail.includes('@')) setForgotSent(true);
                    }}
                  >
                    Send Reset Link
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AuthCard>
    </UserLayout>
  );
}
