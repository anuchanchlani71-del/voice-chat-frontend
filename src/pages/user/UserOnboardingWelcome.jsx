import React from 'react';
import { useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import AuthCard from '../../components/user/AuthCard';
import { PeopleVoiceConnectionIllustration } from '../../components/user/UserVisuals';

export default function UserOnboardingWelcome() {
  const navigate = useNavigate();

  return (
    <UserLayout>
      <AuthCard
        step={1}
        totalSteps={3}
        stepTitle="Welcome"
        title="Welcome to Voice Friends!"
        subtitle="Experience genuine social connections through real-time voice conversations."
        wide={true}
      >
        {/* Large Editorial People Connection Artwork */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <PeopleVoiceConnectionIllustration />
        </div>

        {/* Value Proposition Highlights */}
        <div style={{ marginBottom: 28 }}>
          <div className="welcome-feature-card">
            <div className="welcome-feature-icon">
              🎙️
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', color: 'var(--user-text)', fontWeight: 700 }}>
                Live Topic Discovery
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
                Find people who share your exact interests &mdash; from gaming and music to tech and late night talks.
              </p>
            </div>
          </div>

          <div className="welcome-feature-card">
            <div className="welcome-feature-icon">
              🔒
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', color: 'var(--user-text)', fontWeight: 700 }}>
                Friends-Only &amp; Safe Calls
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
                You are always in control. 1-to-1 voice calls are strictly friends-only with complete safety moderation.
              </p>
            </div>
          </div>

          <div className="welcome-feature-card">
            <div className="welcome-feature-icon">
              🎧
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', color: 'var(--user-text)', fontWeight: 700 }}>
                Interactive Group Voice Rooms
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
                Host or join public rooms (open to anyone) or private invite-only rooms with your selected friends.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => navigate('/onboarding/profile')}
          className="btn-user-primary"
        >
          <span>Let&rsquo;s Set Up Your Profile</span>
          <span style={{ fontSize: '1.1rem' }}>&rarr;</span>
        </button>
      </AuthCard>
    </UserLayout>
  );
}
