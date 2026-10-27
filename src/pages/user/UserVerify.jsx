import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import OtpInput from '../../components/user/OtpInput';
import { IconShield, IconCheck } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';

export default function UserVerify() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(55);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const email = user?.email || 'alex@example.com';

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = (codeToVerify = otpValue) => {
    setErrorMsg('');
    if (codeToVerify.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/onboarding');
      }, 650);
    }, 550);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtpValue('');
    setErrorMsg('');
    setCountdown(60);
    setCanResend(false);
  };

  const handleFillDemoCode = () => {
    setOtpValue('123456');
    setErrorMsg('');
  };

  return (
    <UserLayout>
      <AuthCard
        icon={<IconShield size={26} />}
        badgeText="Security Verification"
        title="Verify Your Account"
        subtitle={`We've sent a 6-digit verification code to ${email}`}
      >
        {isSuccess ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 10px',
            animation: 'cardFadeIn 0.3s ease'
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(74, 222, 128, 0.15)',
              border: '2px solid #4ADE80',
              color: '#4ADE80',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <IconCheck size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--user-text)', margin: '0 0 6px 0' }}>
              Verification Successful!
            </h3>
            <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Redirecting you to welcome onboarding...
            </p>
          </div>
        ) : (
          <div>
            {/* Interactive OTP Box Row */}
            <OtpInput
              length={6}
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val);
                if (errorMsg) setErrorMsg('');
                if (val.length === 6) {
                  handleVerify(val);
                }
              }}
              isError={Boolean(errorMsg)}
              disabled={isVerifying}
            />

            {errorMsg && (
              <div style={{
                color: 'var(--user-status-error)',
                fontSize: '0.82rem',
                textAlign: 'center',
                marginBottom: 16,
                fontWeight: 600
              }}>
                {errorMsg}
              </div>
            )}

            {/* Resend & Countdown info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              color: 'var(--user-text-secondary)',
              marginBottom: 24,
              padding: '0 4px'
            }}>
              <span>Didn&rsquo;t receive the code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--user-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Resend Code
                </button>
              ) : (
                <span style={{ color: 'var(--user-text-muted)' }}>
                  Resend in <strong style={{ color: 'var(--user-primary)' }}>{countdown}s</strong>
                </span>
              )}
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => handleVerify(otpValue)}
              className="btn-user-primary"
              disabled={isVerifying || otpValue.length !== 6}
              style={{ marginBottom: 12 }}
            >
              {isVerifying ? 'Verifying Code...' : 'Verify & Continue'}
            </button>

            {/* Demo Helper Button */}
            <button
              type="button"
              onClick={handleFillDemoCode}
              className="btn-user-secondary"
              style={{ marginBottom: 20 }}
            >
              ⚡ Use Demo Code: 123456
            </button>

            {/* Wrong email helper */}
            <div style={{
              textAlign: 'center',
              borderTop: '1px solid var(--user-border)',
              paddingTop: 16,
              fontSize: '0.82rem',
              color: 'var(--user-text-secondary)'
            }}>
              Wrong email address?{' '}
              <Link to="/register" style={{ color: 'var(--user-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Change contact info &rarr;
              </Link>
            </div>
          </div>
        )}
      </AuthCard>
    </UserLayout>
  );
}
