import React, { useState } from 'react';
import { useNavigate, Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import { IconUsers } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';

export default function UserRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    agreeTerms: true
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Compute password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: '#FB7185' };
    if (score === 2) return { score: 50, label: 'Fair', color: '#F59E0B' };
    if (score === 3) return { score: 75, label: 'Good', color: '#5BC0EB' };
    return { score: 100, label: 'Strong', color: '#4ADE80' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  // Validations
  const errors = {
    fullName: touched.fullName && !formData.fullName.trim() ? 'Full name is required' : null,
    username: touched.username && (!formData.username.trim() || !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim()))
      ? 'Username must be 3-20 characters (letters, numbers, underscores)'
      : null,
    email: touched.email && (!formData.email.trim() || !formData.email.includes('@'))
      ? 'Please enter a valid email address'
      : null,
    password: touched.password && formData.password.length < 6
      ? 'Password must be at least 6 characters'
      : null,
    agreeTerms: touched.agreeTerms && !formData.agreeTerms
      ? 'You must agree to the Terms & Community Safety Guidelines'
      : null
  };

  const isFormValid =
    formData.fullName.trim().length > 0 &&
    formData.username.trim().length >= 3 &&
    formData.email.includes('@') &&
    formData.password.length >= 6 &&
    formData.agreeTerms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      username: true,
      email: true,
      password: true,
      agreeTerms: true
    });
    setApiError('');

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      // Continue existing onboarding/verification flow
      navigate('/verify');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserLayout>
      <AuthCard
        icon={<IconUsers size={26} />}
        badgeText="Join the Community"
        title="Create Your Account"
        subtitle="Connect with people worldwide who share your passions over live voice chats."
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Alex Morgan"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
              style={{
                borderColor: errors.fullName ? 'var(--user-status-error)' : 'var(--user-border)',
                background: 'var(--user-bg-secondary)',
                color: 'var(--user-text)'
              }}
            />
            {errors.fullName && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {errors.fullName}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Choose a Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--user-text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                @
              </span>
              <input
                type="text"
                className="input-control"
                placeholder="alex_vibes"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                style={{
                  paddingLeft: 30,
                  borderColor: errors.username ? 'var(--user-status-error)' : 'var(--user-border)',
                  background: 'var(--user-bg-secondary)',
                  color: 'var(--user-text)'
                }}
              />
            </div>
            {errors.username && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {errors.username}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-control"
              placeholder="alex@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
              style={{
                borderColor: errors.email ? 'var(--user-status-error)' : 'var(--user-border)',
                background: 'var(--user-bg-secondary)',
                color: 'var(--user-text)'
              }}
            />
            {errors.email && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                style={{
                  paddingRight: 44,
                  borderColor: errors.password ? 'var(--user-status-error)' : 'var(--user-border)',
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

            {/* Password strength meter */}
            {formData.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 3 }}>
                  <span style={{ color: 'var(--user-text-muted)' }}>Strength</span>
                  <span style={{ color: pwdStrength.color, fontWeight: 700 }}>{pwdStrength.label}</span>
                </div>
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${pwdStrength.score}%`,
                      backgroundColor: pwdStrength.color
                    }}
                  />
                </div>
              </div>
            )}

            {errors.password && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Terms & Guidelines Checkbox */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="user-terms-agree"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                style={{
                  accentColor: 'var(--user-primary)',
                  cursor: 'pointer',
                  width: 16,
                  height: 16,
                  marginTop: 2
                }}
              />
              <label htmlFor="user-terms-agree" style={{ fontSize: '0.82rem', color: 'var(--user-text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                I agree to the <span style={{ color: 'var(--user-primary)' }}>Terms of Service</span>, <span style={{ color: 'var(--user-primary)' }}>Privacy Policy</span>, and <span style={{ color: 'var(--user-primary)' }}>Community Safety Guidelines</span>.
              </label>
            </div>
            {errors.agreeTerms && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                {errors.agreeTerms}
              </div>
            )}
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

          {/* Submit */}
          <button
            type="submit"
            className="btn-user-primary"
            disabled={isLoading}
            style={{ marginBottom: 18 }}
          >
            {isLoading ? 'Creating Account...' : 'Continue to Verification'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid var(--user-border)',
          paddingTop: 18,
          fontSize: '0.88rem',
          color: 'var(--user-text-secondary)'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--user-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign In &rarr;
          </Link>
        </div>
      </AuthCard>
    </UserLayout>
  );
}
