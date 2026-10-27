import React from 'react';

export default function AuthCard({
  title,
  subtitle,
  badgeText,
  icon,
  step,
  totalSteps = 3,
  stepTitle,
  children,
  wide = false
}) {
  const showProgress = typeof step === 'number';
  const progressPercent = showProgress ? (step / totalSteps) * 100 : 0;

  return (
    <div className={`user-auth-card ${wide ? 'wide' : ''}`}>
      {/* Onboarding progress bar if step is provided */}
      {showProgress && (
        <div className="onboarding-progress-bar-wrap">
          <div className="onboarding-progress-header">
            <span>Step {step} of {totalSteps}</span>
            <span>{stepTitle || ''}</span>
          </div>
          <div className="onboarding-progress-track">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="onboarding-step-pills">
            <div className={`onboarding-step-dot ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>
              <span className="onboarding-step-dot-circle" />
              <span>1. Welcome</span>
            </div>
            <div className={`onboarding-step-dot ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>
              <span className="onboarding-step-dot-circle" />
              <span>2. Profile</span>
            </div>
            <div className={`onboarding-step-dot ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}`}>
              <span className="onboarding-step-dot-circle" />
              <span>3. Interests</span>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      {(title || subtitle || icon || badgeText) && (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {icon && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255, 107, 107, 0.12)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              fontSize: 26,
              color: 'var(--user-primary)',
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.18)'
            }}>
              {icon}
            </div>
          )}

          {badgeText && (
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              color: 'var(--user-primary)',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10
            }}>
              {badgeText}
            </div>
          )}

          {title && (
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--user-text)',
              margin: '0 0 8px 0',
              lineHeight: 1.2
            }}>
              {title}
            </h1>
          )}

          {subtitle && (
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--user-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 420,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
