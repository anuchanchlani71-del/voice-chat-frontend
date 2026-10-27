import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../router';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import CallDetailModal from '../components/modals/CallDetailModal';
import ReportDetailModal from '../components/modals/ReportDetailModal';
import {
  IconUsers,
  IconPhoneCall,
  IconUserCheck,
  IconShieldAlert,
  IconBan,
  IconTag,
  IconClock,
  IconEye,
  IconMic
} from '../components/common/Icons';
import {
  adminGetDashboardStats,
  adminGetDashboardCharts,
  adminGetReports,
  adminGetVoiceCalls,
  adminGetInterests
} from '../services/adminApi';

export default function Dashboard({ onNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Dynamic Dashboard States
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    activeFriendships: 0,
    pendingFriendRequests: 0,
    voiceCallsToday: 0,
    voiceMinutesToday: 0,
    averageCallDuration: '0m 0s',
    totalReports: 0,
    pendingReports: 0,
    blockedUsers: 0,
    totalInterests: 0
  });

  const [chartData, setChartData] = useState({
    callVolume: Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0');
      return { hour: `${h}:00`, calls: 0 };
    }),
    peakHour: '00:00',
    totalVoiceMinutes: 0
  });

  const [pendingReports, setPendingReports] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [popularInterests, setPopularInterests] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingInterests, setLoadingInterests] = useState(true);

  const [errorStats, setErrorStats] = useState(null);
  const [errorChart, setErrorChart] = useState(null);
  const [errorReports, setErrorReports] = useState(null);
  const [errorCalls, setErrorCalls] = useState(null);
  const [errorInterests, setErrorInterests] = useState(null);

  const fetchDashboardData = useCallback(() => {
    // 1. Stats
    setLoadingStats(true);
    setErrorStats(null);
    adminGetDashboardStats()
      .then((res) => {
        if (res && res.stats) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        setErrorStats(err.message || 'Failed to load platform stats.');
      })
      .finally(() => setLoadingStats(false));

    // 2. Charts
    setLoadingChart(true);
    setErrorChart(null);
    adminGetDashboardCharts()
      .then((res) => {
        if (res && res.chart) {
          setChartData(res.chart);
        }
      })
      .catch((err) => {
        setErrorChart(err.message || 'Failed to load call volume chart.');
      })
      .finally(() => setLoadingChart(false));

    // 3. Moderation Action Queue
    setLoadingReports(true);
    setErrorReports(null);
    adminGetReports({ limit: 3, status: 'pending' })
      .then((res) => {
        if (res && Array.isArray(res.reports)) {
          setPendingReports(res.reports);
        }
      })
      .catch((err) => {
        setErrorReports(err.message || 'Failed to load moderation queue.');
      })
      .finally(() => setLoadingReports(false));

    // 4. Recent Voice Calls
    setLoadingCalls(true);
    setErrorCalls(null);
    adminGetVoiceCalls({ limit: 4 })
      .then((res) => {
        if (res && Array.isArray(res.calls)) {
          setRecentCalls(res.calls);
        }
      })
      .catch((err) => {
        setErrorCalls(err.message || 'Failed to load recent voice calls.');
      })
      .finally(() => setLoadingCalls(false));

    // 5. Popular Discovery Interests
    setLoadingInterests(true);
    setErrorInterests(null);
    adminGetInterests({ limit: 8 })
      .then((res) => {
        if (res && Array.isArray(res.interests)) {
          setPopularInterests(res.interests);
        }
      })
      .catch((err) => {
        setErrorInterests(err.message || 'Failed to load interest tags.');
      })
      .finally(() => setLoadingInterests(false));
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Hourly call volume distribution calculation
  const volumeList = Array.isArray(chartData.callVolume) && chartData.callVolume.length > 0
    ? chartData.callVolume
    : Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, calls: 0 }));

  const maxCalls = Math.max(1, ...volumeList.map((d) => d.calls || 0));
  const currentHourNum = new Date().getHours();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconMic size={28} style={{ color: 'var(--primary-500)' }} />
            Platform Dashboard
          </h1>
          <p className="page-desc">
            Phase 1 MVP Overview: Interest-based discovery, friend connections, and 1-to-1 voice chat monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/voice-calls')}
          >
            <IconPhoneCall size={16} />
            Voice Call Logs
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/safety-center')}
          >
            <IconShieldAlert size={16} />
            Safety Center
          </button>
        </div>
      </div>

      {/* Stats Error Notification if any */}
      {errorStats && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-500)',
            color: 'var(--danger-700)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px'
          }}
        >
          <span>{errorStats}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={(stats.totalUsers ?? 0).toLocaleString()}
          trend={loadingStats ? 'Loading...' : `${(stats.totalUsers ?? 0).toLocaleString()} registered`}
          trendType="up"
          icon={IconUsers}
          iconBg="var(--accent-50)"
          iconColor="var(--accent-color-light)"
          accentColor="var(--accent-gradient)"
        />

        <StatCard
          title="Online Users"
          value={(stats.onlineUsers ?? 0).toLocaleString()}
          trend={loadingStats ? 'Loading...' : 'Active now'}
          trendType="up"
          icon={IconMic}
          iconBg="rgba(16, 185, 129, 0.08)"
          iconColor="#34d399"
          accentColor="#10b981"
          isLive={true}
        />

        <StatCard
          title="Active Friendships"
          value={(stats.activeFriendships ?? 0).toLocaleString()}
          trend={loadingStats ? 'Loading...' : 'Connected peers'}
          trendType="neutral"
          icon={IconUserCheck}
          iconBg="rgba(56, 189, 248, 0.08)"
          iconColor="#38bdf8"
          accentColor="#0ea5e9"
        />

        <StatCard
          title="Pending Requests"
          value={(stats.pendingFriendRequests ?? 0).toLocaleString()}
          trend={loadingStats ? 'Loading...' : 'Awaiting accept'}
          trendType="neutral"
          icon={IconClock}
          iconBg="rgba(245, 158, 11, 0.08)"
          iconColor="#fbbf24"
          accentColor="#f59e0b"
        />

        <StatCard
          title="1-to-1 Voice Calls Today"
          value={(stats.voiceCallsToday ?? 0).toLocaleString()}
          trend={loadingStats ? 'Loading...' : `${(stats.voiceMinutesToday ?? 0).toLocaleString()} call mins`}
          trendType="up"
          icon={IconPhoneCall}
          iconBg="var(--accent-50)"
          iconColor="var(--accent-color-light)"
          accentColor="var(--accent-gradient)"
        />

        <StatCard
          title="Pending Reports"
          value={stats.pendingReports ?? 0}
          trend={loadingStats ? 'Loading...' : 'Requires action'}
          trendType="danger"
          icon={IconShieldAlert}
          iconBg="rgba(239, 68, 68, 0.08)"
          iconColor="#f87171"
          accentColor="#ef4444"
        />

        <StatCard
          title="Blocked Users"
          value={stats.blockedUsers ?? 0}
          trend={loadingStats ? 'Loading...' : 'Mutual blocks'}
          trendType="warn"
          icon={IconBan}
          iconBg="rgba(148, 163, 184, 0.06)"
          iconColor="#94a3b8"
          accentColor="#64748b"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid-2">
        {/* Voice Call Volume Chart Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconPhoneCall size={18} style={{ color: 'var(--accent-color)' }} />
              <span>1-to-1 Voice Chat Volume (24h)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600' }}>
              Avg Duration: {stats.averageCallDuration || '0m 0s'}
            </span>
          </div>

          <div className="card-body">
            {loadingChart ? (
              <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                Loading call volume...
              </div>
            ) : errorChart ? (
              <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-600)', fontSize: '13px' }}>
                {errorChart}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', paddingTop: '20px', gap: '4px', overflowX: 'auto' }}>
                {volumeList.map((bar, i) => {
                  const hourNum = parseInt(bar.hour.split(':')[0], 10);
                  const isCurrent = hourNum === currentHourNum;
                  const callsCount = bar.calls || 0;
                  const heightPercent = callsCount > 0 ? Math.max(12, (callsCount / maxCalls) * 100) : 8;

                  return (
                    <div key={i} style={{ flex: 1, minWidth: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9.5px', color: 'var(--slate-400)', fontWeight: '600' }}>
                        {callsCount > 0 ? callsCount : ''}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: isCurrent ? 'var(--accent-gradient)' : (callsCount > 0 ? 'var(--primary-400)' : 'rgba(255, 255, 255, 0.06)'),
                          boxShadow: isCurrent ? '0 0 12px var(--accent-glow)' : 'none',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                        title={`${bar.hour}: ${callsCount} voice calls`}
                      />
                      <span style={{ fontSize: '10px', color: isCurrent ? 'var(--accent-color-light)' : 'var(--slate-500)', fontWeight: isCurrent ? '700' : '500' }}>
                        {bar.hour.split(':')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--slate-100)', fontSize: '12.5px', color: 'var(--slate-600)' }}>
              <div>
                <span style={{ fontWeight: '700', color: 'var(--slate-900)' }}>
                  {(chartData.totalVoiceMinutes ?? stats.voiceMinutesToday ?? 0).toLocaleString()}
                </span> audio minutes streamed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-500)' }}></span>
                <span>Peak hour: {chartData.peakHour || '00:00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Moderation Alert Queue Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconShieldAlert size={18} style={{ color: 'var(--danger-500)' }} />
              <span>Moderation Action Queue</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/reports')}
            >
              View all ({stats.pendingReports ?? pendingReports.length})
            </button>
          </div>

          <div className="card-body" style={{ padding: '12px 16px' }}>
            {loadingReports ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                Loading moderation queue...
              </div>
            ) : errorReports ? (
              <div style={{ padding: '16px', color: 'var(--danger-700)', background: 'var(--danger-50)', borderRadius: 'var(--radius-md)', fontSize: '12.5px' }}>
                {errorReports}
              </div>
            ) : pendingReports.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                ✓ No pending moderation reports in queue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingReports.slice(0, 3).map((rep) => {
                  const reportedUser = rep.reportedUser || {};
                  return (
                    <div
                      key={rep.id || rep._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: rep.status === 'pending' ? 'var(--danger-50)' : 'var(--slate-50)',
                        border: `1px solid ${rep.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt=""
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
                            @{reportedUser.username || reportedUser.fullName || 'user'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--danger-700)', fontWeight: '600' }}>
                            {rep.reasonCategory || rep.reason || rep.type || 'Moderation Flag'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={rep.status || 'pending'} />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedReport(rep)}
                          title="Review details"
                        >
                          <IconEye size={14} />
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Voice Calls & Top Interests */}
      <div className="dashboard-grid-2">
        {/* Recent Voice Calls Stream */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconPhoneCall size={18} style={{ color: 'var(--primary-500)' }} />
              <span>Recent 1-to-1 Voice Calls</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/voice-calls')}
            >
              Full Call Log →
            </button>
          </div>

          <div className="table-container">
            {loadingCalls ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                Loading recent call sessions...
              </div>
            ) : errorCalls ? (
              <div style={{ padding: '16px', color: 'var(--danger-700)', background: 'var(--danger-50)', borderRadius: 'var(--radius-md)', fontSize: '12.5px' }}>
                {errorCalls}
              </div>
            ) : recentCalls.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px' }}>
                No voice call records found.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Caller &amp; Receiver</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.slice(0, 4).map((call) => {
                    const callerName = call.caller?.username || call.caller?.fullName || 'caller';
                    const receiverName = call.receiver?.username || call.receiver?.fullName || 'receiver';
                    const durationText = call.durationFormatted || (call.durationSeconds !== undefined ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : '0m 0s');
                    const timeText = call.startedAt
                      ? (call.startedAt.includes(' ') ? call.startedAt.split(' ')[1] : new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                      : (call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

                    return (
                      <tr key={call.id || call._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--slate-900)' }}>@{callerName}</span>
                            <span style={{ color: 'var(--primary-500)', fontWeight: '700' }}>→</span>
                            <span style={{ fontWeight: '600', color: 'var(--slate-900)' }}>@{receiverName}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                          {durationText}
                        </td>
                        <td>
                          <StatusBadge status={call.status || 'completed'} />
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                          {timeText}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon-only"
                            onClick={() => setSelectedCall(call)}
                            title="View Call Session Details"
                          >
                            <IconEye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Discovery Tags Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconTag size={18} style={{ color: 'var(--primary-500)' }} />
              <span>Popular Discovery Interest Tags</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/interests')}
            >
              Manage Tags →
            </button>
          </div>

          <div className="card-body" style={{ padding: '16px' }}>
            {loadingInterests ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                Loading interest tags...
              </div>
            ) : errorInterests ? (
              <div style={{ padding: '16px', color: 'var(--danger-700)', background: 'var(--danger-50)', borderRadius: 'var(--radius-md)', fontSize: '12.5px' }}>
                {errorInterests}
              </div>
            ) : popularInterests.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px' }}>
                No discovery tags configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {popularInterests.slice(0, 8).map((tag) => (
                  <div
                    key={tag.id || tag._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'var(--slate-50)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px'
                    }}
                  >
                    {tag.icon && <span>{tag.icon}</span>}
                    <span style={{ fontWeight: '600', color: 'var(--slate-800)' }}>{tag.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--primary-700)', background: 'var(--primary-50)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      {(tag.userCount ?? 0).toLocaleString()} users
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '12px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', fontSize: '12.5px', color: 'var(--primary-800)' }}>
              <strong>Phase 1 Matching Rule:</strong> Users must select at least 2 interest tags on sign-up. Discovery feed prioritizes mutual tags with friends-only voice access.
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CallDetailModal
        call={selectedCall}
        isOpen={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />

      <ReportDetailModal
        report={selectedReport}
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

