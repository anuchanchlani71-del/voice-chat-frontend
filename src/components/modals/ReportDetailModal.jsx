import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import {
  adminGetReportById,
  adminUpdateReportStatus,
  adminUpdateUserStatus
} from '../../services/adminApi';

export default function ReportDetailModal({ report, isOpen, onClose, onActionSuccess }) {
  const [detailReport, setDetailReport] = useState(report);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (report && isOpen) {
      setDetailReport(report);
      setActionError(null);
      const identifier = report.id || report._id;
      if (identifier) {
        adminGetReportById(identifier)
          .then((res) => {
            if (res && res.report) {
              setDetailReport(res.report);
            }
          })
          .catch(() => {
            // Keep existing prop data on error
          });
      }
    }
  }, [report, isOpen]);

  if (!detailReport) return null;

  const reportedUser = detailReport.reportedUser || {};
  const reporter = detailReport.reporter || {};

  // 1. Dismiss Report
  const handleDismiss = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const identifier = detailReport.id || detailReport._id;
      const res = await adminUpdateReportStatus(identifier, {
        status: 'dismissed',
        resolutionAction: 'Dismissed by moderator'
      });
      if (res && res.report) {
        setDetailReport(res.report);
      }
      if (onActionSuccess) {
        onActionSuccess(res?.report || detailReport);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to dismiss report.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Issue Warning
  const handleIssueWarning = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const identifier = detailReport.id || detailReport._id;
      const res = await adminUpdateReportStatus(identifier, {
        status: 'resolved',
        resolutionAction: 'Warning issued'
      });
      if (res && res.report) {
        setDetailReport(res.report);
      }
      if (onActionSuccess) {
        onActionSuccess(res?.report || detailReport);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to issue warning.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Suspend User & Resolve Report
  const handleSuspendUser = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const targetUserId = reportedUser.id || reportedUser._id;
      if (!targetUserId) {
        throw new Error('Reported user ID not found.');
      }

      // Step 1: Suspend user
      await adminUpdateUserStatus(targetUserId, { accountStatus: 'suspended' });

      // Step 2: Resolve report
      const identifier = detailReport.id || detailReport._id;
      const res = await adminUpdateReportStatus(identifier, {
        status: 'resolved',
        resolutionAction: 'User suspended'
      });

      if (res && res.report) {
        setDetailReport(res.report);
      }
      if (onActionSuccess) {
        onActionSuccess(res?.report || detailReport);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(false);
    }
  };

  const isResolvedOrDismissed = detailReport.status === 'resolved' || detailReport.status === 'dismissed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Moderation Report Review"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={actionLoading}>
            Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--slate-600)' }}
              onClick={handleDismiss}
              disabled={actionLoading || isResolvedOrDismissed}
            >
              {actionLoading ? 'Updating...' : 'Dismiss Report'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--warning-700)', borderColor: 'var(--warning-500)' }}
              onClick={handleIssueWarning}
              disabled={actionLoading || isResolvedOrDismissed}
            >
              {actionLoading ? 'Updating...' : 'Issue Warning'}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleSuspendUser}
              disabled={actionLoading || isResolvedOrDismissed}
            >
              {actionLoading ? 'Updating...' : 'Suspend User'}
            </button>
          </div>
        </div>
      }
    >
      {/* Error Message */}
      {actionError && (
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
          {actionError}
        </div>
      )}

      {/* Resolution Action Notice if already handled */}
      {detailReport.resolutionAction && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '16px',
            background: 'var(--slate-100)',
            border: '1px solid var(--border-color)',
            color: 'var(--slate-800)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <span><strong>Resolution Action:</strong> {detailReport.resolutionAction}</span>
          {detailReport.resolvedAt && (
            <span style={{ color: 'var(--slate-500)' }}>{detailReport.resolvedAt.substring(0, 16)}</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', background: 'var(--slate-100)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
            {detailReport.id || detailReport._id}
          </span>
          <StatusBadge status={detailReport.status || 'pending'} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          Reported on {detailReport.date || detailReport.createdAt?.substring(0, 10) || 'Recently'}
        </span>
      </div>

      {/* Reported & Reporter info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--danger-50)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '11px', color: 'var(--danger-700)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
            Reported User (Accused)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
                {reportedUser.fullName || reportedUser.username || 'Unknown User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                @{reportedUser.username || 'user'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
          <div style={{ fontSize: '11px', color: 'var(--slate-600)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
            Reporting User (Complainant)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={reporter.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
                {reporter.fullName || reporter.username || 'Unknown User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                @{reporter.username || 'user'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Reason */}
      <div className="form-group">
        <label className="form-label">Violation Category</label>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--danger-700)', background: 'var(--danger-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
          {detailReport.reasonCategory || detailReport.reason || 'General Violation'}
        </div>
      </div>

      {/* Complainant Statement */}
      <div className="form-group">
        <label className="form-label">Report Description / User Statement</label>
        <div style={{ fontSize: '13.5px', color: 'var(--slate-700)', background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-sm)', lineHeight: 1.5, border: '1px solid var(--slate-200)' }}>
          {detailReport.description ? `"${detailReport.description}"` : 'No statement provided.'}
        </div>
      </div>

      {/* Admin Notes */}
      {detailReport.notes && (
        <div className="form-group">
          <label className="form-label">Moderator Internal Log &amp; Heuristics</label>
          <div style={{ fontSize: '13px', color: '#fbbf24', background: 'var(--warning-50)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            {detailReport.notes}
          </div>
        </div>
      )}
    </Modal>
  );
}

