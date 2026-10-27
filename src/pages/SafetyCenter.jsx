import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../router';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import UserDetailModal from '../components/modals/UserDetailModal';
import EmptyState from '../components/common/EmptyState';
import {
  IconShield,
  IconShieldAlert,
  IconBan,
  IconAlertTriangle,
  IconClock,
  IconEye,
  IconAlertOctagon
} from '../components/common/Icons';
import {
  adminGetSafetyOverview,
  adminGetFlaggedUsers,
  adminGetRepeatOffenders,
  adminUpdateUserStatus,
  adminGetSettings
} from '../services/adminApi';

export default function SafetyCenter({ onNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const [selectedUser, setSelectedUser] = useState(null);

  const [metrics, setMetrics] = useState({
    activeReportsCount: 0,
    criticalFlaggedUsers: 0,
    dailyBlockIncidents: 0,
    suspendedUsersCount: 0,
    totalReports: 0,
    totalBlocks: 0,
    safetyAlertsCount: 0
  });
  const [repeatOffendersCount, setRepeatOffendersCount] = useState(0);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, flaggedRes, repeatRes, settingsRes] = await Promise.all([
        adminGetSafetyOverview().catch(() => ({ success: false, metrics: {} })),
        adminGetFlaggedUsers({ limit: 20 }).catch(() => ({ success: false, flaggedUsers: [] })),
        adminGetRepeatOffenders({ limit: 1 }).catch(() => ({ success: false, pagination: { totalItems: 0 } })),
        adminGetSettings().catch(() => ({ success: false, settings: null }))
      ]);

      if (overviewRes && overviewRes.metrics) {
        setMetrics((prev) => ({ ...prev, ...overviewRes.metrics }));
      }
      if (flaggedRes && Array.isArray(flaggedRes.flaggedUsers)) {
        setFlaggedUsers(flaggedRes.flaggedUsers);
      }
      if (repeatRes && repeatRes.pagination) {
        setRepeatOffendersCount(repeatRes.pagination.totalItems ?? repeatRes.pagination.total ?? 0);
      } else if (repeatRes && Array.isArray(repeatRes.data)) {
        setRepeatOffendersCount(repeatRes.data.length);
      }
      if (settingsRes && settingsRes.settings) {
        setSettings(settingsRes.settings);
      }
    } catch (err) {
      console.error('Failed to load safety center data:', err);
      setError(err.message || 'Failed to load safety metrics and flagged accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFlagReason = (u) => {
    if (u.accountStatus === 'suspended') {
      return 'Account suspended due to moderation sanctions or multiple violations';
    }
    if (u.isBlocked) {
      return 'User account blocked / restricted by peers';
    }
    if (u.reportsCount > 0) {
      return `${u.reportsCount} active report(s) logged by community members`;
    }
    return 'Flagged for safety review';
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      const res = await adminUpdateUserStatus(userId, { accountStatus: newStatus });
      setFlaggedUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId || u._id === userId) {
            return { ...u, accountStatus: newStatus };
          }
          return u;
        })
      );
      if (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) {
        setSelectedUser((prev) => (prev ? { ...prev, accountStatus: newStatus } : null));
      }
      fetchData();
      return res?.user || null;
    } catch (err) {
      console.error('Failed to update user status:', err);
      throw err;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconShield size={28} style={{ color: 'var(--primary-500)' }} />
            Safety &amp; Moderation Center
          </h1>
          <p className="page-desc">
            Centralized risk oversight, rate-limiting policies, and safety thresholds for Voice Chat &amp; Friends (Phase 1).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/repeat-offenders')}
            title="View multi-reporter repeat patterns"
          >
            <IconAlertOctagon size={16} style={{ color: 'var(--danger-500)' }} />
            Repeat Offender Detector ({repeatOffendersCount})
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/reports')}
          >
            <IconShieldAlert size={16} />
            Go to Reports Queue ({metrics.activeReportsCount || 0})
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-50)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger-700)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          title="Active Reports"
          value={metrics.activeReportsCount || 0}
          trend={metrics.activeReportsCount > 0 ? "Requires Action" : "All Clear"}
          trendType={metrics.activeReportsCount > 0 ? "danger" : "neutral"}
          icon={IconShieldAlert}
          iconBg="rgba(239, 68, 68, 0.08)"
          iconColor="#f87171"
          accentColor="#ef4444"
        />

        <StatCard
          title="Critical Flagged Users"
          value={metrics.criticalFlaggedUsers || 0}
          trend={metrics.criticalFlaggedUsers > 0 ? `${metrics.criticalFlaggedUsers} under review` : "None flagged"}
          trendType={metrics.criticalFlaggedUsers > 0 ? "warn" : "neutral"}
          icon={IconAlertTriangle}
          iconBg="rgba(245, 158, 11, 0.08)"
          iconColor="#fbbf24"
          accentColor="#f59e0b"
        />

        <StatCard
          title="Daily Block Incidents"
          value={metrics.dailyBlockIncidents || 0}
          trend="Mutual restrictions"
          trendType="neutral"
          icon={IconBan}
          iconBg="rgba(148, 163, 184, 0.06)"
          iconColor="#94a3b8"
          accentColor="#64748b"
        />

        <StatCard
          title="Spam Request Violations"
          value={metrics.safetyAlertsCount || metrics.suspendedUsersCount || 0}
          trend="Auto-throttled"
          trendType={metrics.safetyAlertsCount > 0 ? "danger" : "neutral"}
          icon={IconClock}
          iconBg="var(--accent-50)"
          iconColor="var(--accent-color-light)"
          accentColor="var(--accent-gradient)"
        />
      </div>

      {/* Safety Architecture Rule Cards */}
      <div className="dashboard-grid-2">
        {/* Core Model Safety Rules */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconShield size={18} style={{ color: 'var(--primary-500)' }} />
              <span>Phase 1 Voice Safety Principles</span>
            </div>
          </div>
          <div className="card-body" style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>No Stranger Calling:</strong> Direct voice calling is 100% disabled for non-friends.
              </li>
              <li>
                <strong>Bidirectional Consent:</strong> Voice chat unlocks only after both users accept friendship.
              </li>
              <li>
                <strong>Private Contact Data:</strong> Phone numbers and emails are never exposed to other users.
              </li>
              <li>
                <strong>Instant Mutual Block:</strong> Blocking a user terminates all voice calls and removes mutual visibility.
              </li>
            </ul>
          </div>
        </div>

        {/* Real-time Moderation Thresholds */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconAlertTriangle size={18} style={{ color: 'var(--warning-700)' }} />
              <span>Automated Rate Limits &amp; Thresholds</span>
            </div>
          </div>
          <div className="card-body" style={{ fontSize: '13px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Max Friend Requests Per Hour:</span>
                <span style={{ fontWeight: '700', color: 'var(--slate-900)' }}>
                  {settings?.friendRequestRateLimitPerHour !== undefined
                    ? `${settings.friendRequestRateLimitPerHour} requests / hr`
                    : (loading ? 'Loading...' : 'Unavailable')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Auto-Flag Report Threshold:</span>
                <span style={{ fontWeight: '700', color: 'var(--danger-700)' }}>
                  {settings?.autoFlagReportThreshold !== undefined
                    ? `${settings.autoFlagReportThreshold} reports in 24 hours`
                    : (loading ? 'Loading...' : 'Unavailable')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Mic Permission Pre-check:</span>
                <span
                  style={{
                    fontWeight: '700',
                    color: settings?.requireMicPermissionBeforeCall
                      ? 'var(--success-700)'
                      : (settings?.requireMicPermissionBeforeCall === false ? 'var(--warning-700)' : 'var(--slate-900)')
                  }}
                >
                  {settings?.requireMicPermissionBeforeCall !== undefined
                    ? (settings.requireMicPermissionBeforeCall ? 'Mandatory Before Calling' : 'Optional / Disabled')
                    : (loading ? 'Loading...' : 'Unavailable')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-600)' }}>Max Single Call Duration:</span>
                <span style={{ fontWeight: '700', color: 'var(--slate-900)' }}>
                  {settings?.maxCallDurationMinutes !== undefined
                    ? `${settings.maxCallDurationMinutes} minutes (Auto-hangup)`
                    : (loading ? 'Loading...' : 'Unavailable')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Users Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <IconAlertTriangle size={18} style={{ color: 'var(--danger-500)' }} />
            <span>High Risk &amp; Flagged Accounts Requiring Moderation</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Status</th>
                <th>Reports Against</th>
                <th>Flag Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>
                    Loading flagged accounts...
                  </td>
                </tr>
              ) : flaggedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>
                    No high risk or flagged accounts found.
                  </td>
                </tr>
              ) : (
                flaggedUsers.map((u) => (
                  <tr key={u.id || u._id}>
                    <td>
                      <div className="avatar-cell">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt=""
                          className="user-avatar"
                        />
                        <div className="user-names">
                          <span className="user-fullname">{u.fullName || 'User'}</span>
                          <span className="user-handle" style={{ color: 'var(--danger-700)' }}>@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={u.accountStatus} />
                    </td>
                    <td>
                      <span style={{ fontWeight: '800', color: 'var(--danger-500)', fontSize: '14px' }}>
                        {u.reportsCount || 0} report(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--slate-700)', maxWidth: '300px' }}>
                      {getFlagReason(u)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        <IconEye size={14} />
                        Inspect User
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onStatusChange={handleUserStatusChange}
      />
    </div>
  );
}

