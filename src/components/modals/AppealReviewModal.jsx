import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { adminGetAppealById } from '../../services/adminApi';
import {
  IconFileText,
  IconShieldAlert,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconBan
} from '../common/Icons';

export default function AppealReviewModal({
  appeal,
  isOpen,
  onClose,
  onSave
}) {
  const [detailAppeal, setDetailAppeal] = useState(appeal);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (appeal && isOpen) {
      setDetailAppeal(appeal);
      setReviewStatus(appeal.status || 'pending');
      setAdminNotes(appeal.adminNotes || '');
      setSaveError(null);

      const appealId = appeal.id || appeal._id;
      if (appealId) {
        adminGetAppealById(appealId)
          .then((res) => {
            if (res && (res.appeal || res.data)) {
              const fresh = res.appeal || res.data;
              setDetailAppeal(fresh);
              if (fresh.status) setReviewStatus(fresh.status);
              if (fresh.adminNotes) setAdminNotes(fresh.adminNotes);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch fresh appeal details:', err);
          });
      }
    }
  }, [appeal, isOpen]);

  if (!appeal && !detailAppeal) return null;

  const currentAppeal = detailAppeal || appeal;
  const user = currentAppeal.user || {};

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      if (onSave) {
        await onSave({
          ...currentAppeal,
          status: reviewStatus,
          adminNotes: adminNotes.trim(),
          user: {
            ...user,
            accountStatus: reviewStatus === 'approved' ? 'active' : user.accountStatus
          }
        });
      }
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Failed to save appeal review.');
    } finally {
      setIsSaving(false);
    }
  };

  const getActionBadgeClass = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'suspended':
        return 'tag-danger';
      case 'blocked':
        return 'tag-warning';
      case 'restricted':
        return 'tag-primary';
      default:
        return '';
    }
  };

  const formatSubmittedDate = (val) => {
    if (!val) return 'Recently';
    if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Yesterday'))) {
      return val;
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return String(val);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Appeal Request"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSaving}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <IconCheck size={16} />
            {isSaving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave}>
        {saveError && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-50)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger-700)',
              fontSize: '13px'
            }}
          >
            {saveError}
          </div>
        )}

        {/* Appeal Header & Status Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontFamily: 'monospace', background: 'var(--slate-100)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
              {currentAppeal.id}
            </span>
            <StatusBadge status={currentAppeal.status} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
            Submitted on {formatSubmittedDate(currentAppeal.submittedAt || currentAppeal.createdAt)}
          </span>
        </div>

        {/* User Card & Original Sanction Context */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          {/* User Info */}
          <div
            style={{
              background: 'var(--slate-50)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
              Appealing Account
            </div>
            <div className="avatar-cell">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={user.fullName || 'User'}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-900)' }}>
                  {user.fullName || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  @{user.username || 'unknown'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={user.accountStatus || 'active'} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Original Moderation Action */}
          <div
            style={{
              background: 'var(--slate-50)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--danger-500)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
              Original Sanction Applied
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`tag-pill ${getActionBadgeClass(currentAppeal.actionType)}`} style={{ fontWeight: '700' }}>
                {currentAppeal.actionType}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Date: {formatSubmittedDate(currentAppeal.originalActionDate || currentAppeal.createdAt)}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-600)' }}>
              Related Incident Reports: <strong style={{ color: 'var(--slate-900)' }}>{currentAppeal.relatedReportCount ?? currentAppeal.relatedReports?.length ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Original Moderation Reason / System Context */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Original Sanction Reason</label>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--slate-800)',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1.45
            }}
          >
            {currentAppeal.originalReason || 'No original sanction reason recorded.'}
          </div>
        </div>

        {/* User's Appeal Statement */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">User Appeal Statement / Explanation</label>
          <div
            style={{
              fontSize: '13.5px',
              color: 'var(--slate-800)',
              background: 'var(--slate-50)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1.5,
              fontStyle: 'italic'
            }}
          >
            &ldquo;{currentAppeal.appealMessage || 'No statement provided.'}&rdquo;
          </div>
        </div>

        {/* Admin Review Controls */}
        <div
          style={{
            background: 'var(--accent-50)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconFileText size={16} style={{ color: 'var(--primary-500)' }} />
            Moderator Review Decision
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Decision Status</label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              disabled={isSaving}
            >
              <option value="pending">Pending (Awaiting investigation)</option>
              <option value="under_review">Under Review (Actively verifying call logs)</option>
              <option value="approved">Approved (Lift restriction &amp; restore account)</option>
              <option value="rejected">Rejected (Sanction upheld)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Internal Review Notes / Reason</label>
            <textarea
              className="input-control"
              rows={3}
              style={{ width: '100%', resize: 'vertical', minHeight: '75px' }}
              placeholder="Add review notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={isSaving}
            />
            <span className="form-hint">
              Recorded in internal audit log for future reference.
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}

