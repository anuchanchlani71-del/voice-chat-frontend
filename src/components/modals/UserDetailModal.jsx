import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { adminGetUserById, adminUpdateUserStatus } from '../../services/adminApi';

export default function UserDetailModal({ user, isOpen, onClose, onStatusChange }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailUser, setDetailUser] = useState(user);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    if (user) {
      setDetailUser(user);
      setStatusError(null);
      // Fetch freshest user details if ID is available
      const identifier = user.id || user._id || user.username;
      if (identifier && isOpen) {
        adminGetUserById(identifier)
          .then((res) => {
            if (res && res.user) {
              setDetailUser(res.user);
            }
          })
          .catch(() => {
            // Keep existing prop data on error
          });
      }
    }
  }, [user, isOpen]);

  if (!detailUser) return null;

  const handleToggleStatus = async () => {
    const nextStatus = detailUser.accountStatus === 'suspended' ? 'active' : 'suspended';
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      const identifier = detailUser.id || detailUser._id;
      if (onStatusChange) {
        const updated = await onStatusChange(identifier, nextStatus);
        if (updated) {
          setDetailUser(updated);
        } else {
          setDetailUser((prev) => ({ ...prev, accountStatus: nextStatus }));
        }
      } else {
        const res = await adminUpdateUserStatus(identifier, { accountStatus: nextStatus });
        if (res && res.user) {
          setDetailUser(res.user);
        } else {
          setDetailUser((prev) => ({ ...prev, accountStatus: nextStatus }));
        }
      }
    } catch (err) {
      setStatusError(err.message || 'Failed to update user status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const interestsList = Array.isArray(detailUser.interests) ? detailUser.interests : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile Details"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            User ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{detailUser.id || detailUser._id}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isUpdatingStatus}>
              Close
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={handleToggleStatus}
              className={`btn btn-sm ${detailUser.accountStatus === 'suspended' ? 'btn-primary' : 'btn-danger'}`}
            >
              {isUpdatingStatus ? 'Updating...' : (detailUser.accountStatus === 'suspended' ? 'Reactivate Account' : 'Suspend Account')}
            </button>
          </div>
        </div>
      }
    >
      {statusError && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '16px',
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-500)',
            color: 'var(--danger-700)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}
        >
          {statusError}
        </div>
      )}

      {/* Profile Header Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--slate-100)',
          marginBottom: '20px'
        }}
      >
        <img
          src={detailUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
          alt={detailUser.fullName || detailUser.username}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--primary-100)',
            boxShadow: 'var(--shadow-sm)'
          }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--slate-900)' }}>
              {detailUser.fullName || detailUser.username}
            </h2>
            <StatusBadge status={detailUser.isOnline ? 'Online' : 'Offline'} />
            <StatusBadge status={detailUser.accountStatus || 'active'} />
            {detailUser.isBlocked && <StatusBadge status="blocked" label="Blocked by other(s)" />}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
            @{detailUser.username} • Joined {detailUser.joinedDate || 'Recently'}
          </div>

          {detailUser.bio && (
            <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', marginTop: '8px', lineHeight: 1.45 }}>
              {detailUser.bio}
            </p>
          )}

          {interestsList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
              {interestsList.map((tag, i) => (
                <span key={i} className="tag-pill tag-primary">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>Friends</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)' }}>{detailUser.friendsCount ?? 0}</div>
        </div>

        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>Voice Calls</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)' }}>{detailUser.voiceCallsCount ?? 0}</div>
        </div>

        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>Total Voice Time</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-400)' }}>{detailUser.totalVoiceMinutes ?? 0}m</div>
        </div>

        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>Reports Against</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: (detailUser.reportsCount || 0) > 0 ? 'var(--danger-500)' : 'var(--slate-900)' }}>
            {detailUser.reportsCount ?? 0}
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', marginBottom: '16px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Contact &amp; Account Info
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          1-to-1 Voice History
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          onClick={() => setActiveTab('safety')}
        >
          Safety &amp; Flags ({detailUser.reportsCount ?? 0})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          <div>
            <span className="form-label">Email Address (Private)</span>
            <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              {detailUser.email || 'None provided'}
            </div>
          </div>
          <div>
            <span className="form-label">Phone Number (Private)</span>
            <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              {detailUser.phone || 'None provided'}
            </div>
          </div>
          <div>
            <span className="form-label">Last Active Status</span>
            <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              {detailUser.lastSeen || 'Unknown'}
            </div>
          </div>
          <div>
            <span className="form-label">Voice Calling Permission</span>
            <div style={{ fontSize: '13.5px', color: 'var(--success-700)', background: 'var(--success-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>
              Friends-Only 1-to-1 Calling Allowed
            </div>
          </div>
        </div>
      )}

      {activeTab === 'voice' && (
        <div style={{ fontSize: '13px' }}>
          <p style={{ color: 'var(--slate-500)', marginBottom: '12px' }}>
            Recent 1-to-1 voice calls made or received by @{detailUser.username} with connected friends.
          </p>
          <div style={{ background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--slate-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Voice Calls Activity</span>
              <StatusBadge status={detailUser.voiceCallsCount > 0 ? 'completed' : 'pending'} />
            </div>
            <div style={{ color: 'var(--slate-600)', fontSize: '12px' }}>
              Total Sessions: {detailUser.voiceCallsCount ?? 0} • Total Minutes: {detailUser.totalVoiceMinutes ?? 0}m • Codec: Opus 48kbps
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div>
          {(detailUser.reportsCount || 0) === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--success-700)', background: 'var(--success-50)', borderRadius: 'var(--radius-md)' }}>
              ✓ No active moderation reports or safety violations on record for this user.
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'var(--danger-50)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', color: 'var(--danger-700)', marginBottom: '4px' }}>
                Account Under Review ({detailUser.reportsCount} report(s) logged)
              </div>
              <p style={{ fontSize: '13px', color: 'var(--danger-700)', margin: 0 }}>
                Flagged for moderation review. Check Reports Queue for incident history and details.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

