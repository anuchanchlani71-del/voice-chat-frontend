import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { adminGetRepeatOffenderDetail } from '../../services/adminApi';
import {
  IconAlertTriangle,
  IconShieldAlert,
  IconUserCheck,
  IconClock,
  IconEye,
  IconCheck,
  IconBan
} from '../common/Icons';

export default function PatternDetailModal({
  pattern,
  isOpen,
  onClose,
  onInspectUser,
  onAction
}) {
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (pattern && isOpen) {
      setDetailData(null);
      const userId = pattern.reportedUser?.id || pattern.reportedUser?._id || pattern.reportedUser?.username || pattern.id;
      if (userId) {
        setLoadingDetail(true);
        adminGetRepeatOffenderDetail(userId)
          .then((res) => {
            if (res && res.data) {
              setDetailData(res.data);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch repeat offender detail from backend:', err);
          })
          .finally(() => {
            setLoadingDetail(false);
          });
      }
    }
  }, [pattern, isOpen]);

  if (!pattern) return null;

  const activePattern = detailData || pattern;
  const reportedUser = activePattern.reportedUser || pattern.reportedUser || {};
  const reportsTimeline = activePattern.reportsTimeline || pattern.reportsTimeline || [];
  const distinctCount = activePattern.distinctReporters ?? activePattern.distinctReportersCount ?? pattern.distinctReporters ?? pattern.distinctReportersCount ?? 0;
  const totalReportsCount = activePattern.totalReports ?? activePattern.totalReportsCount ?? pattern.totalReports ?? pattern.totalReportsCount ?? 0;
  const priority = activePattern.priority || pattern.priority || 'medium';
  const severity = activePattern.highestSeverity || activePattern.severity || pattern.highestSeverity || pattern.severity || 'medium';
  const patternStatus = activePattern.patternStatus || pattern.patternStatus || 'requires_review';
  const reasons = activePattern.reportReasons || activePattern.reasons || pattern.reportReasons || pattern.reasons || [];
  const notes = activePattern.notes || pattern.notes;

  const formatIncidentDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    if (typeof dateVal === 'string' && (dateVal.includes('ago') || dateVal.includes('Today') || dateVal.includes('Yesterday'))) {
      return dateVal;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateVal);
    }
  };

  const latestReportText = formatIncidentDate(activePattern.latestReportAt || activePattern.latestReport || pattern.latestReportAt || pattern.latestReport);

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-500)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning-700)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'var(--slate-100)', color: 'var(--slate-700)', border: '1px solid var(--border-color)' };
    }
  };

  const priorityStyle = getPriorityStyle(priority);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repeat Offender Pattern Review"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onAction && onAction('dismiss', activePattern)}
            >
              Dismiss Pattern
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--warning-700)', borderColor: 'var(--warning-500)' }}
              onClick={() => onAction && onAction('warn', activePattern)}
            >
              Issue Warning
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onAction && onAction('suspend', activePattern)}
            >
              Suspend Account
            </button>
          </div>
        </div>
      }
    >
      {/* Target Account Summary Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--slate-50)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div className="avatar-cell" style={{ flex: 1, minWidth: '220px' }}>
          <img
            src={reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={reportedUser.fullName || 'User'}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-color)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--slate-900)' }}>
                {reportedUser.fullName || 'User'}
              </span>
              <StatusBadge status={reportedUser.accountStatus || 'active'} />
              {reportedUser.isBlocked && <StatusBadge status="blocked" label="Blocked by others" />}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
              @{reportedUser.username || 'unknown'} • Account joined {reportedUser.joinedDate || 'Recently'}
            </div>
          </div>
        </div>

        {onInspectUser && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onInspectUser(reportedUser)}
          >
            <IconEye size={14} />
            Full Profile History
          </button>
        )}
      </div>

      {/* Metric Highlights Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <div style={{ background: 'var(--danger-50)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--danger-700)', fontWeight: '700', textTransform: 'uppercase' }}>
            Distinct Complainants
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger-500)', marginTop: '2px' }}>
            {distinctCount} Users
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            Across {totalReportsCount} total reports
          </div>
        </div>

        <div style={{ background: priorityStyle.bg, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: priorityStyle.border }}>
          <div style={{ fontSize: '10.5px', color: priorityStyle.color, fontWeight: '700', textTransform: 'uppercase' }}>
            Pattern Priority
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: priorityStyle.color, marginTop: '2px', textTransform: 'capitalize' }}>
            {priority} Priority
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            Severity: {severity}
          </div>
        </div>

        <div style={{ background: 'var(--slate-100)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--slate-600)', fontWeight: '700', textTransform: 'uppercase' }}>
            Pattern Status
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--slate-900)', marginTop: '4px', textTransform: 'capitalize' }}>
            {String(patternStatus).replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Latest: {latestReportText}
          </div>
        </div>
      </div>

      {/* Reported Violation Categories */}
      <div style={{ marginBottom: '20px' }}>
        <div className="form-label" style={{ marginBottom: '8px' }}>
          Aggregated Violation Categories
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {reasons.length > 0 ? (
            reasons.map((r, i) => (
              <span
                key={i}
                className="tag-pill"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--danger-500)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontWeight: '600'
                }}
              >
                ⚠ {r}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>No specific category tags recorded.</span>
          )}
        </div>
      </div>

      {/* Moderator Notes */}
      {notes && (
        <div style={{ marginBottom: '20px' }}>
          <div className="form-label" style={{ marginBottom: '6px' }}>
            System Heuristic Assessment
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--slate-800)',
              background: 'var(--accent-50)',
              border: '1px solid var(--border-color)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1.5
            }}
          >
            {notes}
          </div>
        </div>
      )}

      {/* Chronological Distinct Complainant Breakdown */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <div className="form-label" style={{ margin: 0 }}>
            Chronological Reports by Distinct Complainants ({reportsTimeline.length})
          </div>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            Each report is verified from an independent user account
          </span>
        </div>

        {loadingDetail && reportsTimeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-500)', fontSize: '13px' }}>
            Loading complete report timeline...
          </div>
        ) : reportsTimeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-500)', fontSize: '13px', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
            No individual report breakdown available for this pattern.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reportsTimeline.map((item, idx) => {
              const reporter = item.reporter || {};
              const catName = item.category || item.reasonCategory || item.reason || 'General Violation';
              const sev = item.severity || 'medium';
              const isHigh = sev === 'high' || sev === 'critical';
              const statementText = item.statement || item.description || item.reason || item.notes || 'No statement provided.';

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: 'var(--slate-50)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={reporter.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={reporter.fullName || 'Reporter'}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
                          {reporter.fullName || 'Community User'}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginLeft: '4px' }}>
                          (@{reporter.username || 'user'})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isHigh ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isHigh ? 'var(--danger-500)' : 'var(--warning-700)'
                        }}
                      >
                        {catName}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                        {formatIncidentDate(item.date || item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--slate-700)',
                      lineHeight: '1.45',
                      background: 'var(--bg-card)',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    &ldquo;{statementText}&rdquo;
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

