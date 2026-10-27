import React, { useState } from 'react';
import { useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import { MOCK_AVATARS } from '../../data/userMockData';
import { IconMic } from '../../components/common/Icons';

export default function UserOnboardingProfile() {
  const navigate = useNavigate();

  const [selectedAvatarId, setSelectedAvatarId] = useState('av-1');
  const [displayName, setDisplayName] = useState('Alex Morgan');
  const [bio, setBio] = useState('Late night lofi lover • Indie game developer • Always down for good voice chats 🎙️');
  const [touched, setTouched] = useState(false);

  const maxBioLength = 160;
  const isNameValid = displayName.trim().length >= 2;

  const handleContinue = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isNameValid) return;
    navigate('/onboarding/interests');
  };

  return (
    <UserLayout>
      <AuthCard
        step={2}
        totalSteps={3}
        stepTitle="Profile Setup"
        title="Personalize Your Profile"
        subtitle="Choose your voice avatar and tell others a little bit about yourself."
        wide={true}
      >
        <form onSubmit={handleContinue} noValidate>
          {/* Avatar Selection Grid */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ color: 'var(--user-text)', marginBottom: 8, display: 'block' }}>
              Choose Your Community Avatar
            </label>

            <div className="avatar-grid-picker">
              {MOCK_AVATARS.map(avatar => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    className={`avatar-option-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div
                      className="avatar-circle-icon"
                      style={{ background: avatar.bg }}
                    >
                      {avatar.emoji}
                    </div>
                    <span className="avatar-label-text">{avatar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Display Name */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" style={{ color: 'var(--user-text)' }}>
              Display Name
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Your name or nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => setTouched(true)}
              style={{
                borderColor: touched && !isNameValid ? 'var(--user-status-error)' : 'var(--user-border)',
                background: 'var(--user-bg-secondary)',
                color: 'var(--user-text)'
              }}
            />
            {touched && !isNameValid && (
              <div style={{ color: 'var(--user-status-error)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>
                Display name must be at least 2 characters.
              </div>
            )}
          </div>

          {/* Bio / Status */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ color: 'var(--user-text)', margin: 0 }}>
                About You / Voice Bio
              </label>
              <span style={{ fontSize: '0.75rem', color: bio.length > maxBioLength ? 'var(--user-status-error)' : 'var(--user-text-muted)' }}>
                {bio.length} / {maxBioLength}
              </span>
            </div>
            <textarea
              className="input-control"
              rows={3}
              placeholder="What topics do you enjoy chatting about? What vibes are you looking for?"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
              style={{
                background: 'var(--user-bg-secondary)',
                borderColor: 'var(--user-border)',
                color: 'var(--user-text)',
                resize: 'none'
              }}
            />
          </div>

          {/* Voice Tip Prompt */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(25, 211, 174, 0.08)',
            border: '1px solid rgba(25, 211, 174, 0.25)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 26
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(25, 211, 174, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--user-primary)',
              flexShrink: 0
            }}>
              <IconMic size={18} />
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--user-text)' }}>Microphone ready:</strong> You can test and calibrate your mic anytime in voice settings once inside.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 14 }}>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="btn-user-secondary"
              style={{ flex: 1 }}
            >
              &larr; Back
            </button>
            <button
              type="submit"
              className="btn-user-primary"
              style={{ flex: 2 }}
            >
              <span>Continue to Interests</span>
              <span style={{ fontSize: '1.1rem' }}>&rarr;</span>
            </button>
          </div>
        </form>
      </AuthCard>
    </UserLayout>
  );
}
