import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import AppealReviewModal from '../components/modals/AppealReviewModal';
import {
  IconFileText,
  IconClock,
  IconEye,
  IconCheck,
  IconBan,
  IconShieldAlert,
  IconAlertTriangle,
  IconScale
} from '../components/common/Icons';
import {
  adminGetAppeals,
  adminUpdateAppealStatus,
  adminUpdateUserStatus
} from '../services/adminApi';

export default function AppealRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [actionTypeFilter, setActionTypeFilter] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const [appealsList, setAppealsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0
  });

  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const pageSize = 5;

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminGetAppeals({ limit: 100 });
      const all = (res && (res.appeals || res.data)) || [];
      setStats({
        pending: all.filter((a) => a.status === 'pending').length,
        underReview: all.filter((a) => a.status === 'under_review').length,
        approved: all.filter((a) => a.status === 'approved').length,
        rejected: all.filter((a) => a.status === 'rejected').length
      });
    } catch {
      // Keep existing stats
    }
  }, []);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetAppeals({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        actionType: actionTypeFilter
      });

      if (res && (res.appeals || res.data)) {
        const items = res.appeals || res.data;
        setAppealsList(items);
        const total = res.pagination?.totalItems ?? res.pagination?.total ?? items.length;
        setTotalItems(total);
      } else {
        setAppealsList([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to load appeals:', err);
      setError(err.message || 'Failed to load appeal requests.');
      setAppealsList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, actionTypeFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleSaveReview = async (updatedAppeal) => {
    const appealId = updatedAppeal.id || updatedAppeal._id;
    if (!appealId) return;

    try {
      await adminUpdateAppealStatus(appealId, {
        status: updatedAppeal.status,
        adminNotes: updatedAppeal.adminNotes
      });

      // If restriction was lifted / approved, update user's accountStatus to active
      if (updatedAppeal.status === 'approved') {
        const userId =
          updatedAppeal.user?.id || updatedAppeal.user?._id || updatedAppeal.user?.username;
        if (userId) {
          try {
            await adminUpdateUserStatus(userId, { accountStatus: 'active' });
          } catch (userErr) {
            console.warn('Could not auto-restore user status on appeal approval:', userErr);
          }
        }
      }

      await Promise.all([fetchAppeals(), fetchStats()]);
      setToastMessage(`Appeal ${appealId} review saved as "${updatedAppeal.status}".`);
      setTimeout(() => setToastMessage(''), 4000);
      setSelectedAppeal(null);
    } catch (err) {
      console.error('Failed to save appeal review:', err);
      throw err;
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
    if (
      typeof val === 'string' &&
      (val.includes('ago') || val.includes('Today') || val.includes('Yesterday'))
    ) {
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

  // Table Columns
  const columns = [
    {
      header: 'Appeal ID',
      render: (row) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: '700',
            fontSize: '12.5px',
            background: 'var(--slate-100)',
            padding: '3px 8px',
            borderRadius: '4px',
            color: 'var(--slate-800)'
          }}
        >
          {row.id}
        </span>
      )
    },
    {
      header: 'User',
      render: (row) => {
        const u = row.user || {};
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
              <span className="user-handle" style={{ color: 'var(--slate-400)' }}>
                @{u.username || 'unknown'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Original Action',
      render: (row) => (
        <span className={`tag-pill ${getActionBadgeClass(row.actionType)}`} style={{ fontWeight: '700' }}>
          {row.actionType}
        </span>
      )
    },
    {
      header: 'Appeal Reason',
      render: (row) => (
        <div style={{ maxWidth: '320px' }}>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--slate-700)',
              lineHeight: '1.45',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            title={row.appealMessage}
          >
            &ldquo;{row.appealMessage}&rdquo;
          </span>
        </div>
      )
    },
    {
      header: 'Submitted',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-400)', fontWeight: '500' }}>
          {formatSubmittedDate(row.submittedAt || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedAppeal(row)}
            title="Review user appeal and take moderation decision"
          >
            <IconEye size={14} />
            Review
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
            <IconFileText size={28} style={{ color: 'var(--primary-500)' }} />
            Appeal / Review Requests
          </h1>
          <p className="page-desc">
            Review user appeals against account restrictions and moderation actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-pending">
            {stats.pending} Actionable Appeals
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            background: 'var(--accent-50)',
            border: '1px solid var(--accent-100)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--accent-color-light)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconCheck size={16} />
          {toastMessage}
        </div>
      )}

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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchAppeals}>
            Retry
          </button>
        </div>
      )}

      {/* Top Summary / KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Pending Appeals"
          value={stats.pending}
          trend={stats.pending > 0 ? "Requires Action" : "All Clear"}
          trendType={stats.pending > 0 ? "danger" : "neutral"}
          icon={IconClock}
          iconBg="rgba(239, 68, 68, 0.08)"
          iconColor="#f87171"
          accentColor="#ef4444"
        />

        <StatCard
          title="Under Review"
          value={stats.underReview}
          trend={stats.underReview > 0 ? "Investigation in progress" : "None"}
          trendType={stats.underReview > 0 ? "warn" : "neutral"}
          icon={IconEye}
          iconBg="rgba(245, 158, 11, 0.08)"
          iconColor="#fbbf24"
          accentColor="#f59e0b"
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          trend="Restrictions lifted"
          trendType="success"
          icon={IconCheck}
          iconBg="rgba(16, 185, 129, 0.08)"
          iconColor="#34d399"
          accentColor="#10b981"
        />

        <StatCard
          title="Rejected"
          value={stats.rejected}
          trend="Sanctions upheld"
          trendType="neutral"
          icon={IconBan}
          iconBg="rgba(148, 163, 184, 0.06)"
          iconColor="#94a3b8"
          accentColor="#64748b"
        />
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search appeals..."
          />

          {/* Filters */}
          <FilterBar>
            {/* Status Filter */}
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Action Type Filter */}
            <select
              className="select-control"
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Action Type"
            >
              <option value="All Actions">All Actions</option>
              <option value="Suspended">Suspended</option>
              <option value="Blocked">Blocked</option>
              <option value="Restricted">Restricted</option>
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Appeals Table Card */}
      <div className="card">
        {loading && appealsList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading appeal requests...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={appealsList}
            emptyComponent={
              <EmptyState
                icon={IconFileText}
                title="No appeal requests found."
                description="No user appeals match your current search query or filter criteria."
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

      {/* Review Modal */}
      <AppealReviewModal
        appeal={selectedAppeal}
        isOpen={Boolean(selectedAppeal)}
        onClose={() => setSelectedAppeal(null)}
        onSave={handleSaveReview}
      />
    </div>
  );
}

