import React from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { IconMic, IconUsers, IconPhoneCall, IconShield, IconSparkles } from '../../components/common/Icons';
import HeroSlider from '../../components/user/HeroSlider';

export default function UserHomeLanding() {
  return (
    <UserLayout>
      <div style={{ maxWidth: 1060, width: '100%', textAlign: 'center', margin: '0 auto', padding: '6px 0 28px' }}>
        
        {/* Dynamic Hero Slider Carousel */}
        <HeroSlider />

        {/* Live Social Voice Experience Preview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          textAlign: 'left',
          marginBottom: 36
        }}>
          {/* Card 1: Active Group Voice Room Preview */}
          <div style={{
            background: 'var(--user-bg-card)',
            border: '1px solid var(--user-border)',
            borderRadius: 20,
            padding: '24px 26px',
            boxShadow: 'var(--user-card-shadow)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--user-primary)',
                background: 'rgba(255, 107, 107, 0.12)',
                border: '1px solid rgba(255, 107, 107, 0.25)',
                padding: '3px 10px',
                borderRadius: 999
              }}>
                ● Live Stage
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--user-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--user-status-online)' }}>●</span> 8 / 15 Listening
              </span>
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--user-text)', margin: '0 0 6px 0' }}>
              Late Night Lo-Fi &amp; Deep Talks ☕
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--user-text-secondary)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Chill conversation about life, tech projects, and indie music. All friendly listeners welcome!
            </p>

            {/* Speaking Participants Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--user-bg-secondary)',
              border: '1px solid var(--user-border)',
              borderRadius: 14,
              padding: '10px 14px',
              marginBottom: 16
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--user-brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 0 12px rgba(255, 107, 107, 0.4)'
              }}>
                🎧
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--user-text)' }}>Alex Morgan</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--user-primary)', fontWeight: 600 }}>Speaking</span>
                </div>
                <div className="voice-wave-visualizer" style={{ marginTop: 2 }}>
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                </div>
              </div>
            </div>

            {/* Room Topic Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--user-border)', color: 'var(--user-text-secondary)', padding: '3px 10px', borderRadius: 999 }}>
                #LoFiBeats
              </span>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--user-border)', color: 'var(--user-text-secondary)', padding: '3px 10px', borderRadius: 999 }}>
                #DeepTalks
              </span>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--user-border)', color: 'var(--user-text-secondary)', padding: '3px 10px', borderRadius: 999 }}>
                🌎 Anyone Access
              </span>
            </div>
          </div>

          {/* Card 2: 1-to-1 Friends Calling & Safety Preview */}
          <div style={{
            background: 'var(--user-bg-card)',
            border: '1px solid var(--user-border)',
            borderRadius: 20,
            padding: '24px 26px',
            boxShadow: 'var(--user-card-shadow)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--user-accent)',
                background: 'rgba(192, 132, 252, 0.12)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                padding: '3px 10px',
                borderRadius: 999
              }}>
                🔒 Friends 1-on-1 Call
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--user-status-online)', fontWeight: 600 }}>
                ● HD Voice Connected
              </span>
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--user-text)', margin: '0 0 6px 0' }}>
              Private Mutual Friends Audio 🎙️
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--user-text-secondary)', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Zero stranger harassment. Calls are strictly bidirectional and unlocked only between accepted mutual friends.
            </p>

            {/* Friend Call Participant State */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--user-bg-secondary)',
              border: '1px solid var(--user-border)',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #8B2FC9, #D896FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  ✨
                </div>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--user-brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginLeft: -10, border: '2px solid var(--user-bg-secondary)' }}>
                  🎧
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--user-text)' }}>Call with Maya Chen</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--user-text-muted)' }}>Duration: 14m 32s &bull; Encrypted Voice</div>
              </div>
            </div>

            {/* Safety Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--user-border)', color: 'var(--user-text-secondary)', padding: '3px 10px', borderRadius: 999 }}>
                🔒 Strict Mutual Consent
              </span>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--user-border)', color: 'var(--user-text-secondary)', padding: '3px 10px', borderRadius: 999 }}>
                🛡️ Zero Stranger Calling
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          textAlign: 'left',
          marginTop: 10
        }}>
          <div style={{
            background: 'var(--user-bg-card)',
            border: '1px solid var(--user-border)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255, 107, 107, 0.12)',
              color: 'var(--user-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <IconMic size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--user-text)', margin: '0 0 8px 0' }}>
              Group Voice Stages
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--user-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Create open public hangouts or exclusive invite-only stages for your chosen circle.
            </p>
          </div>

          <div style={{
            background: 'var(--user-bg-card)',
            border: '1px solid var(--user-border)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(192, 132, 252, 0.14)',
              color: 'var(--user-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <IconPhoneCall size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--user-text)', margin: '0 0 8px 0' }}>
              Friends 1-on-1 Calling
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--user-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Instant crystal-clear voice calling restricted strictly to your accepted mutual friends.
            </p>
          </div>

          <div style={{
            background: 'var(--user-bg-card)',
            border: '1px solid var(--user-border)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(74, 222, 128, 0.12)',
              color: 'var(--user-status-online)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <IconUsers size={22} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--user-text)', margin: '0 0 8px 0' }}>
              Smart Interest Discovery
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--user-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Get paired with people and live conversation topics aligned with your unique passions.
            </p>
          </div>
        </div>

        {/* Quick Navigation Direct Links */}
        <div style={{
          marginTop: 36,
          padding: '16px 20px',
          borderRadius: 14,
          background: 'var(--user-bg-secondary)',
          border: '1px dashed var(--user-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          flexWrap: 'wrap',
          fontSize: '0.82rem',
          color: 'var(--user-text-muted)'
        }}>
          <span><strong style={{ color: 'var(--user-text)' }}>Quick Step Shortcuts:</strong></span>
          <Link to="/login" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>1. Login</Link>
          <span>&bull;</span>
          <Link to="/register" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>2. Register</Link>
          <span>&bull;</span>
          <Link to="/verify" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>3. Verify OTP</Link>
          <span>&bull;</span>
          <Link to="/onboarding" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>4. Welcome</Link>
          <span>&bull;</span>
          <Link to="/onboarding/profile" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>5. Profile</Link>
          <span>&bull;</span>
          <Link to="/onboarding/interests" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 600 }}>6. Interests</Link>
          <span>&bull;</span>
          <Link to="/discover" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 700 }}>7. Discover Lounge 🎙️</Link>
          <span>&bull;</span>
          <Link to="/profile" style={{ color: 'var(--user-primary)', textDecoration: 'none', fontWeight: 700 }}>8. My Profile 🎧</Link>
        </div>
      </div>
    </UserLayout>
  );
}
