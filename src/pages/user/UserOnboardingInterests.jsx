import React, { useState } from 'react';
import { useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import InterestPicker from '../../components/user/InterestPicker';
import { IconCheck } from '../../components/common/Icons';
import { CelebrationVoiceArtwork } from '../../components/user/UserVisuals';
import { useAuth } from '../../context/AuthContext';
import { MOCK_INTEREST_CATEGORIES } from '../../data/userMockData';

export default function UserOnboardingInterests() {
  const navigate = useNavigate();
  const { finishOnboarding } = useAuth();

  const [selectedTagIds, setSelectedTagIds] = useState(['tag-lofi', 'tag-valorant', 'tag-deeptalks']);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [apiError, setApiError] = useState('');

  const minRequired = 3;
  const isSatisfied = selectedTagIds.length >= minRequired;

  const handleToggleTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleComplete = async () => {
    if (!isSatisfied) return;

    setIsFinishing(true);
    setApiError('');

    try {
      const tagMap = {};
      MOCK_INTEREST_CATEGORIES.forEach(cat => {
        cat.tags.forEach(t => {
          tagMap[t.id] = t.name;
        });
      });
      const interestNames = selectedTagIds.map(id => tagMap[id] || id);

      await finishOnboarding(interestNames);
      setIsCompleted(true);
    } catch (err) {
      setApiError(err.message || 'Failed to save interests. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <UserLayout>
      <AuthCard
        step={3}
        totalSteps={3}
        stepTitle="Interests"
        title="What Do You Love Talking About?"
        subtitle={`Pick at least ${minRequired} topics to help us connect you with the right rooms and friends.`}
        wide={true}
      >
        {isCompleted ? (
          <div style={{
            textAlign: 'center',
            padding: '16px 10px',
            animation: 'cardFadeIn 0.35s ease'
          }}>
            {/* High-Fidelity Celebratory Audio Artwork */}
            <CelebrationVoiceArtwork />

            <h2 style={{ fontSize: '1.6rem', color: 'var(--user-text)', margin: '0 0 10px 0', fontWeight: 800 }}>
              You&rsquo;re All Set! 🎉
            </h2>
            <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.92rem', maxWidth: 460, margin: '0 auto 26px', lineHeight: 1.5 }}>
              Your profile has been created with <strong style={{ color: 'var(--user-primary)' }}>{selectedTagIds.length} personalized topics</strong>. You are ready to explore live voice rooms and connect with awesome new friends.
            </p>

            {/* Profile summary card preview */}
            <div style={{
              background: 'var(--user-bg-secondary)',
              border: '1px solid var(--user-border)',
              borderRadius: 16,
              padding: '18px 22px',
              maxWidth: 420,
              margin: '0 auto 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              textAlign: 'left'
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--user-brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0
              }}>
                🎧
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--user-text)' }}>Alex Morgan</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--user-text-secondary)', marginBottom: 5 }}>@alex_vibes</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 107, 107, 0.12)', color: 'var(--user-primary)', border: '1px solid rgba(255, 107, 107, 0.25)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    🎙️ Voice Ready
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(74, 222, 128, 0.12)', color: 'var(--user-status-online)', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    ● Online
                  </span>
                </div>
              </div>
            </div>

            {/* Finish CTA */}
            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <button
                type="button"
                onClick={() => navigate('/discover')}
                className="btn-user-primary"
                style={{ padding: '15px 28px', fontSize: '1.02rem' }}
              >
                <span>Enter Discover Lounge</span>
                <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {apiError && (
              <div style={{
                background: 'rgba(251, 113, 133, 0.12)',
                border: '1px solid rgba(251, 113, 133, 0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#FB7185',
                fontSize: '0.86rem',
                marginBottom: 16
              }}>
                {apiError}
              </div>
            )}
            {/* Interest Picker Component */}
            <InterestPicker
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              minRequired={minRequired}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => navigate('/onboarding/profile')}
                className="btn-user-secondary"
                style={{ flex: 1 }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="btn-user-primary"
                disabled={!isSatisfied || isFinishing}
                style={{ flex: 2 }}
              >
                {isFinishing ? (
                  'Saving Preferences...'
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <IconCheck size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </UserLayout>
  );
}
