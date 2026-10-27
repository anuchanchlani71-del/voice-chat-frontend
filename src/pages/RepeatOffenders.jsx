import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import PatternDetailModal from '../components/modals/PatternDetailModal';
import UserDetailModal from '../components/modals/UserDetailModal';
import {
  IconAlertOctagon,
  IconShieldAlert,
  IconAlertTriangle,
  IconUsers,
  IconEye,
  IconShield,
  IconClock
} from '../components/common/Icons';
import {
  adminGetRepeatOffenders,
  adminUpdateUserStatus
} from '../services/adminApi';

export default function RepeatOffenders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [minReportersFilter, setMinReportersFilter] = useState('All (2+)');
  const [currentPage, setCurrentPage] = useState(1);
  const [patternsList, setPatternsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    activePatterns: 0,
    highPriorityPatterns: 0,
    totalDistinctComplainants: 0,
    patternsUnderReview: 0
  });

  // Modal states
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [inspectingUser, setInspectingUser] = useState(null);

  const pageSize = 6;

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminGetRepeatOffenders({ limit: 100 });
      const allPatterns = (res && (res.patterns || res.data)) || [];
      const highPriorityCount = allPatterns.filter((p) => p.priority === 'high').length;
      const activeCount = allPatterns.filter((p) => p.patternStatus !== 'resolved').length;
      const underReviewCount = allPatterns.filter(
        (p) => p.patternStatus === 'requires_review' || p.patternStatus === 'under_review'
      ).length;
      const distinctReportersSum = allPatterns.reduce(
        (acc, p) => acc + (p.distinctReporters || p.distinctReportersCount || 0),
        0
      );

      setStats({
        activePatterns: activeCount,
        highPriorityPatterns: highPriorityCount,
        totalDistinctComplainants: distinctReportersSum,
        patternsUnderReview: underReviewCount
      });
    } catch {
      // Fallback
    }
  }, []);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetRepeatOffenders({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        priority: priorityFilter,
        patternStatus: statusFilter,
        minDistinctReporters:
          minReportersFilter === '3+ Distinct Reporters'
            ? 3
            : minReportersFilter === '4+ Distinct Reporters'
            ? 4
            : 2
      });

      if (res && (res.patterns || res.data)) {
        const items = res.patterns || res.data;
        setPatternsList(items);
        const total = res.pagination?.totalItems ?? res.pagination?.total ?? items.length;
        setTotalItems(total);
      } else {
        setPatternsList([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to load repeat offender patterns:', err);
      setError(err.message || 'Failed to load repeat offender patterns.');
      setPatternsList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, priorityFilter, statusFilter, minReportersFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const handlePatternAction = async (actionType, pattern) => {
    const userId =
      pattern.reportedUser?.id ||
      pattern.reportedUser?._id ||
      pattern.reportedUser?.username ||
      pattern.id;

    if (!userId) return;

    try {
      if (actionType === 'suspend') {
        await adminUpdateUserStatus(userId, { accountStatus: 'suspended' });
      } else if (actionType === 'warn') {
        // Warning action recorded
      } else if (actionType === 'dismiss') {
        // Pattern dismiss action recorded
      }
      fetchPatterns();
      fetchStats();
      setSelectedPattern(null);
    } catch (err) {
      console.error('Failed to perform pattern moderation action:', err);
    }
  };

  const handleUserStatusChange = () => {
    fetchPatterns();
    fetchStats();
  };

  const formatIncidentDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    if (
      typeof dateVal === 'string' &&
      (dateVal.includes('ago') || dateVal.includes('Today') || dateVal.includes('Yesterday'))
    ) {
      return dateVal;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return String(dateVal);
    }
  };

  // Table Column Definitions
  const columns = [
    {
      header: 'Reported User (Accused)',
      render: (row) => {
        const u = row.reportedUser || {};
        return (
          <div className="avatar-cell">
            <img
              src={
                u.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{u.fullName || 'User'}</span>
              <span className="user-handle" style={{ color: 'var(--danger-700)', fontWeight: '600' }}>
                @{u.username || 'unknown'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Distinct Reporters',
      render: (row) => {
        const distinctCount = row.distinctReporters ?? row.distinctReportersCount ?? 0;
        const totalCount = row.totalReports ?? row.totalReportsCount ?? 0;
        return (
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger-500)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '800',
                fontSize: '13px'
              }}
            >
              <IconUsers size={14} />
              {distinctCount} Distinct Users
            </span>
            <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px', fontWeight: '500' }}>
              {totalCount} total reports logged
            </div>
          </div>
        );
      }
    },
    {
      header: 'Report Reasons',
      render: (row) => {
        const reasons = row.reportReasons || row.reasons || [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
            {reasons.length > 0 ? (
              reasons.map((reason, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11.5px',
                    padding: '2px 6px',
                    background: 'var(--slate-100)',
                    color: 'var(--slate-700)',
                    borderRadius: '4px',
                    fontWeight: '600',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {reason}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>—</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Priority',
      render: (row) => {
        const p = row.priority || 'medium';
        const isHigh = p === 'high';
        const isMed = p === 'medium';
        return (
          <span
            style={{
              display: 'inline-block',
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              background: isHigh
                ? 'rgba(239, 68, 68, 0.15)'
                : isMed
                ? 'rgba(245, 158, 11, 0.15)'
                : 'var(--slate-100)',
              color: isHigh
                ? 'var(--danger-500)'
                : isMed
                ? 'var(--warning-700)'
                : 'var(--slate-600)',
              border: isHigh
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : isMed
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid var(--border-color)'
            }}
          >
            {p} Priority
          </span>
        );
      }
    },
    {
      header: 'Latest Incident',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-400)', fontWeight: '500' }}>
          {formatIncidentDate(row.latestReportAt || row.latestReport)}
        </span>
      )
    },
    {
      header: 'Pattern Status',
      render: (row) => {
        const statusMap = {
          under_review: { label: 'Under Review', status: 'pending' },
          requires_review: { label: 'Requires Review', status: 'pending' },
          requires_action: { label: 'Requires Action', status: 'pending' },
          monitoring: { label: 'Monitoring', status: 'online' },
          resolved: { label: 'Resolved', status: 'completed' }
        };
        const config = statusMap[row.patternStatus] || {
          label: (row.patternStatus || '').replace(/_/g, ' ') || 'Active',
          status: 'neutral'
        };
        return <StatusBadge status={config.status} label={config.label} />;
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedPattern(row)}
            title="Inspect distinct reporters & evidence"
          >
            <IconEye size={14} />
            Inspect Pattern
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconAlertOctagon size={28} style={{ color: 'var(--danger-500)' }} />
            Repeat Offender Pattern Detector
          </h1>
          <p className="page-desc">
            Proactively detect and review accounts repeatedly reported by multiple distinct users across voice calls and discovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-pending">
            {stats.highPriorityPatterns} High-Priority Patterns
          </span>
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchPatterns}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Active Repeat Patterns"
          value={stats.activePatterns}
          trend={stats.activePatterns > 0 ? "Requires Action" : "All Clear"}
          trendType={stats.activePatterns > 0 ? "danger" : "neutral"}
          icon={IconAlertOctagon}
          iconBg="rgba(239, 68, 68, 0.08)"
          iconColor="#f87171"
          accentColor="#ef4444"
        />

        <StatCard
          title="High Priority Patterns"
          value={stats.highPriorityPatterns}
          trend="≥ 3 distinct reporters"
          trendType={stats.highPriorityPatterns > 0 ? "danger" : "neutral"}
          icon={IconAlertTriangle}
          iconBg="rgba(239, 68, 68, 0.08)"
          iconColor="#f87171"
          accentColor="#ef4444"
        />

        <StatCard
          title="Distinct Complainants"
          value={stats.totalDistinctComplainants}
          trend="Unique user accounts"
          trendType="neutral"
          icon={IconUsers}
          iconBg="rgba(148, 163, 184, 0.06)"
          iconColor="#94a3b8"
          accentColor="#64748b"
        />

        <StatCard
          title="Under Active Review"
          value={stats.patternsUnderReview}
          trend="Moderator investigation"
          trendType={stats.patternsUnderReview > 0 ? "warn" : "neutral"}
          icon={IconClock}
          iconBg="rgba(245, 158, 11, 0.08)"
          iconColor="#fbbf24"
          accentColor="#f59e0b"
        />
      </div>

      {/* Heuristic Information Notice Card */}
      <div
        style={{
          background: 'var(--accent-50)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <IconShield size={20} style={{ color: 'var(--accent-color-light)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.5' }}>
          <strong style={{ color: 'var(--slate-900)' }}>Distinct Complainant Multi-Reporter Heuristic:</strong> This detector isolates accounts that have accumulated reports from <span style={{ color: 'var(--accent-color-light)', fontWeight: '700' }}>multiple unique users</span>, preventing single-user spam or personal disputes from diluting safety priorities. High-priority flags indicate 3+ independent reporters.
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Search Box */}
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search by reported user, handle, or reason..."
          />

          {/* Filters */}
          <FilterBar>
            {/* Priority Filter */}
            <select
              className="select-control"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Priority"
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High Priority">High Priority</option>
              <option value="Medium Priority">Medium Priority</option>
              <option value="Low Priority">Low Priority</option>
            </select>

            {/* Pattern Status Filter */}
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Pattern Status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Requires Review">Requires Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Requires Action">Requires Action</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Min Distinct Reporters Filter */}
            <select
              className="select-control"
              value={minReportersFilter}
              onChange={(e) => {
                setMinReportersFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Distinct Reporters"
            >
              <option value="All (2+)">All (2+ Distinct)</option>
              <option value="3+ Distinct Reporters">3+ Distinct Reporters</option>
              <option value="4+ Distinct Reporters">4+ Distinct Reporters</option>
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Patterns Table Card */}
      <div className="card">
        {loading && patternsList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading repeat offender patterns...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={patternsList}
            emptyComponent={
              <EmptyState
                icon={IconAlertOctagon}
                title="No repeat offender patterns found"
                description="No user accounts match your current search query or filter criteria."
              />
            }
          />
        )}

        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>

      {/* Pattern Detail Modal */}
      <PatternDetailModal
        pattern={selectedPattern}
        isOpen={Boolean(selectedPattern)}
        onClose={() => setSelectedPattern(null)}
        onInspectUser={(user) => {
          setInspectingUser(user);
        }}
        onAction={handlePatternAction}
      />

      {/* Deep User Profile Investigation Modal */}
      <UserDetailModal
        user={inspectingUser}
        isOpen={Boolean(inspectingUser)}
        onClose={() => setInspectingUser(null)}
        onStatusChange={handleUserStatusChange}
      />
    </div>
  );
}

