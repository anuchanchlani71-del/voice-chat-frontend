import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { IconBan, IconCheck, IconAlertTriangle } from '../components/common/Icons';
import { adminGetBlockedUsers } from '../services/adminApi';

export default function BlockedUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [blockList, setBlockList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalActiveCount, setTotalActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);

  const pageSize = 6;

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetBlockedUsers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm
      });

      if (res && res.blockedUsers) {
        setBlockList(res.blockedUsers);
        setTotalItems(res.pagination?.totalItems ?? res.blockedUsers.length);
        if (res.counts) {
          setTotalActiveCount(res.counts.active ?? res.counts.all ?? res.blockedUsers.length);
        } else {
          setTotalActiveCount(res.pagination?.totalItems ?? res.blockedUsers.length);
        }
      } else if (res && res.data) {
        setBlockList(res.data);
        setTotalItems(res.pagination?.totalItems ?? res.data.length);
        setTotalActiveCount(res.pagination?.totalItems ?? res.data.length);
      } else {
        setBlockList([]);
        setTotalItems(0);
        setTotalActiveCount(0);
      }
    } catch (err) {
      console.error('Failed to load blocked users directory:', err);
      setError(err.message || 'Failed to load blocked users from backend.');
      setBlockList([]);
      setTotalItems(0);
      setTotalActiveCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = (id) => {
    setNoticeMessage(
      `Notice: Block relationship ID "${id}" is managed by user-to-user privacy preferences. Admin manual unblock / release endpoint is not provisioned in the backend for Phase 1.`
    );
  };

  const formatDate = (dateVal) => {
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
      header: 'Blocked User (Restricted)',
      render: (row) => {
        const u = row.blockedUser || {};
        return (
          <div className="avatar-cell">
            <img
              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{u.fullName || 'User'}</span>
              <span className="user-handle" style={{ color: 'var(--danger-700)' }}>
                @{u.username || 'unknown'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Blocked By (User)',
      render: (row) => {
        const u = row.blockedBy || {};
        return (
          <div className="avatar-cell">
            <img
              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{u.fullName || 'User'}</span>
              <span className="user-handle">
                @{u.username || 'unknown'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Reason / Incident Context',
      render: (row) => (
        <span style={{ fontSize: '13px', color: 'var(--slate-700)' }}>
          {row.reason || '—'}
        </span>
      )
    },
    {
      header: 'Block Date',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
          {formatDate(row.date || row.createdAt)}
        </span>
      )
    },
    {
      header: 'State',
      render: (row) => (
        <StatusBadge
          status={row.status === 'released' ? 'resolved' : 'blocked'}
          label={row.status === 'released' ? 'Released' : 'Blocked'}
        />
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => handleUnblock(row.id || row._id)}
          title="Manually release block relation"
        >
          Unblock
        </button>
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconBan size={28} style={{ color: 'var(--danger-500)' }} />
            Blocked Users Directory
          </h1>
          <p className="page-desc">
            User-initiated blocks that restrict discovery visibility, friend requests, and 1-to-1 voice connections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="header-pill">
            Total Active Blocks: {totalActiveCount}
          </span>
        </div>
      </div>

      {/* Notice Message Toast/Alert if Unblock clicked */}
      {noticeMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning-50)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--warning-900)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlertTriangle size={18} style={{ color: 'var(--warning-700)', flexShrink: 0 }} />
            <span>{noticeMessage}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setNoticeMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Safety Rule Card */}
      <div style={{ background: 'var(--warning-50)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconBan size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#fef3c7' }}>
          <strong>Block Enforcement:</strong> When User A blocks User B, neither user will appear in Discovery results, friend requests are terminated, and voice calling is strictly forbidden.
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchBlockedUsers}>
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by blocked user, blocker, or reason..."
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading && blockList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading blocked user directory...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={blockList}
            emptyComponent={
              <EmptyState
                icon={IconCheck}
                title="No blocked relationships found"
                description="No block records match the specified query."
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
