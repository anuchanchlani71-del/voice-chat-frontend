import React, { useState, useEffect, useCallback } from 'react';
import Tabs from '../components/common/Tabs';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { IconUserCheck, IconClock, IconCheck, IconX, IconPhoneCall } from '../components/common/Icons';
import { adminGetFriendships } from '../services/adminApi';

export default function Friendships({ defaultTab = 'all' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [friendshipsList, setFriendshipsList] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    accepted: 0,
    pending: 0,
    rejected_cancelled: 0
  });
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageSize = 6;

  const fetchFriendships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetFriendships({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: activeTab
      });

      if (res && res.friendships) {
        setFriendshipsList(res.friendships);
        setTotalItems(res.pagination?.totalItems ?? res.friendships.length);
        if (res.counts) {
          setCounts({
            all: res.counts.all ?? 0,
            accepted: res.counts.accepted ?? 0,
            pending: res.counts.pending ?? 0,
            rejected_cancelled: res.counts.rejected_cancelled ?? 0
          });
        }
      } else if (res && res.data) {
        setFriendshipsList(res.data);
        setTotalItems(res.pagination?.totalItems ?? res.data.length);
      } else {
        setFriendshipsList([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to load friendships:', err);
      setError(err.message || 'Failed to load friendships from server.');
      setFriendshipsList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, activeTab]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const tabs = [
    { id: 'all', label: 'All Connections', count: counts.all },
    { id: 'accepted', label: 'Accepted (Voice Active)', count: counts.accepted },
    { id: 'pending', label: 'Pending Requests', count: counts.pending },
    { id: 'rejected_cancelled', label: 'Rejected / Cancelled', count: counts.rejected_cancelled }
  ];

  const formatRequestedDate = (dateVal) => {
    if (!dateVal) return '—';
    if (typeof dateVal === 'string' && (dateVal.includes('ago') || dateVal.includes('Today') || dateVal.includes('Yesterday'))) {
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

  const columns = [
    {
      header: 'Requester (Sent Request)',
      render: (row) => {
        const u = row.requester || {};
        return (
          <div className="avatar-cell">
            <img
              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{u.fullName || 'User'}</span>
              <span className="user-handle">@{u.username || 'unknown'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Recipient (Target User)',
      render: (row) => {
        const u = row.recipient || {};
        return (
          <div className="avatar-cell">
            <img
              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{u.fullName || 'User'}</span>
              <span className="user-handle">@{u.username || 'unknown'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Matched Interests',
      render: (row) => {
        const interests = Array.isArray(row.matchedInterests) ? row.matchedInterests : [];
        if (interests.length === 0) {
          return <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>—</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {interests.map((interest, idx) => (
              <span key={idx} className="tag-pill tag-primary">
                #{interest}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Connection Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Requested At',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
          {formatRequestedDate(row.requestedAt || row.createdAt)}
        </span>
      )
    },
    {
      header: '1-to-1 Voice Access',
      render: (row) => (
        <div>
          {row.status === 'accepted' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-700)', fontWeight: '600', fontSize: '12.5px' }}>
              <IconPhoneCall size={14} />
              <span>Unlocked ({row.voiceCallsCount || 0} calls)</span>
            </div>
          ) : (
            <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>Locked (Requires Acceptance)</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconUserCheck size={28} style={{ color: 'var(--primary-500)' }} />
            Friendships &amp; Requests
          </h1>
          <p className="page-desc">
            Core trust gate: Users must be mutual accepted friends before 1-to-1 voice chat permissions are granted.
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconPhoneCall size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--primary-300)' }}>
          <strong>Voice Safety Rule (Model 7):</strong> Random stranger calling is disabled. All voice calls require bidirectional friend acceptance.
        </div>
      </div>

      {/* Error Alert */}
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchFriendships}>
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
          setCurrentPage(1);
        }}
      />

      {/* Filter / Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by requester or recipient username..."
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading && friendshipsList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading friend connections...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={friendshipsList}
            emptyComponent={
              <EmptyState
                title="No friendship records found"
                description="No friend connections match your current tab or search query."
                actionText={searchTerm ? "Clear Search" : undefined}
                onAction={searchTerm ? () => { setSearchTerm(''); setCurrentPage(1); } : undefined}
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
    </div>
  );
}
