import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { IconBell, IconPhoneCall, IconUserCheck, IconShieldAlert } from '../components/common/Icons';
import { adminGetNotifications } from '../services/adminApi';

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsList, setNotificationsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageSize = 6;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetNotifications({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        type: typeFilter
      });

      if (res && res.notifications) {
        setNotificationsList(res.notifications);
        setTotalItems(res.pagination?.totalItems ?? res.notifications.length);
      } else if (res && res.data) {
        setNotificationsList(res.data);
        setTotalItems(res.pagination?.totalItems ?? res.data.length);
      } else {
        setNotificationsList([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications log.');
      setNotificationsList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'call_alert':
      case 'call_missed':
        return <IconPhoneCall size={16} />;
      case 'friend_request':
      case 'friend_accepted':
        return <IconUserCheck size={16} />;
      case 'safety_alert':
        return <IconShieldAlert size={16} />;
      default:
        return <IconBell size={16} />;
    }
  };

  const getTargetUsername = (target) => {
    if (!target) return 'unknown';
    if (typeof target === 'object') {
      return target.username || target.fullName || target.id || 'unknown';
    }
    return String(target);
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
      header: 'Type',
      render: (row) => (
        <span className="tag-pill tag-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          {renderTypeIcon(row.type)}
          <span>{(row.type || 'system_alert').replace('_', ' ').toUpperCase()}</span>
        </span>
      )
    },
    {
      header: 'Notification Details',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '700', color: 'var(--slate-900)', fontSize: '13.5px' }}>
            {row.title}
          </div>
          <div style={{ color: 'var(--slate-600)', fontSize: '12.5px', marginTop: '2px', lineHeight: 1.4 }}>
            {row.message}
          </div>
        </div>
      )
    },
    {
      header: 'Target User',
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--primary-700)', fontSize: '13px' }}>
          @{getTargetUsername(row.targetUser)}
        </span>
      )
    },
    {
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
          {formatDate(row.date || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Delivery Status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconBell size={28} style={{ color: 'var(--primary-500)' }} />
            System Notifications Log
          </h1>
          <p className="page-desc">
            Phase 1 Notification audit trail: Incoming calls, friend requests, accepts, and safety advisory dispatches.
          </p>
        </div>
      </div>

      {/* Error Banner */}
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchNotifications}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search message or target user..."
          />

          <FilterBar>
            <select
              className="select-control"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Notification Types</option>
              <option value="call_alert">Call Alerts</option>
              <option value="friend_request">Friend Requests</option>
              <option value="friend_accepted">Friend Accepts</option>
              <option value="safety_alert">Safety Advisories</option>
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading && notificationsList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading notification logs...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={notificationsList}
            emptyComponent={
              <EmptyState
                icon={IconBell}
                title="No notification records found"
                description="No push alerts or messages match the search criteria."
                actionText={searchTerm || typeFilter !== 'all' ? "Reset Filter" : undefined}
                onAction={
                  searchTerm || typeFilter !== 'all'
                    ? () => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setCurrentPage(1);
                      }
                    : undefined
                }
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
