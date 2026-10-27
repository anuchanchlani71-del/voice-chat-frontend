import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import GroupVoiceRoomDetailModal from '../components/modals/GroupVoiceRoomDetailModal';
import {
  IconTrash,
  IconEye,
  IconGlobe,
  IconLock,
  IconMic,
  IconCheck,
  IconTag,
  IconBan
} from '../components/common/Icons';
import {
  adminGetGroupVoiceRooms,
  adminUpdateGroupVoiceRoomStatus,
  adminDeleteGroupVoiceRoom
} from '../services/adminApi';

export default function GroupVoiceRooms() {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('all'); // 'all' | 'anyone' | 'invite_only'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'scheduled' | 'ended' | 'closed'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ total: 0, active: 0, anyone: 0, inviteOnly: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Read-only Details Modal state
  const [viewingRoom, setViewingRoom] = useState(null);
  const [feedbackAlert, setFeedbackAlert] = useState(null);
  const pageSize = 6;

  const showSuccess = (msg) => {
    setFeedbackAlert({ type: 'success', message: msg });
    setTimeout(() => {
      setFeedbackAlert(prev => (prev && prev.type === 'success' && prev.message === msg ? null : prev));
    }, 3500);
  };

  const showError = (msg) => {
    setFeedbackAlert({ type: 'error', message: msg });
    setTimeout(() => {
      setFeedbackAlert(prev => (prev && prev.type === 'error' && prev.message === msg ? null : prev));
    }, 4500);
  };

  // Debounce search input to avoid spamming the backend API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch rooms from backend
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetGroupVoiceRooms({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        accessType: accessFilter !== 'all' ? accessFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      if (res && res.success) {
        setRooms(res.groupVoiceRooms || []);
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
        if (res.counts) {
          setCounts(res.counts);
        }
      } else {
        setRooms([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load group voice rooms:', err);
      setError(err.message || 'Failed to load group voice rooms from server.');
      setRooms([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, accessFilter, statusFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Moderation Action: Disable / Close active room
  const handleDisableRoom = async (roomId, title) => {
    if (!window.confirm(`Are you sure you want to disable and close the active voice room "${title}" for safety/moderation?`)) {
      return;
    }
    setActionInProgress(true);
    try {
      const res = await adminUpdateGroupVoiceRoomStatus(roomId, 'closed');
      showSuccess(res.message || `Room "${title}" has been closed by Admin.`);
      await fetchRooms();
      if (viewingRoom && viewingRoom.id === roomId) {
        setViewingRoom(prev => ({ ...prev, status: 'closed', participantCount: 0 }));
      }
    } catch (err) {
      showError(err.message || 'Failed to close room.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Moderation Action: Remove room record
  const handleRemoveRoom = async (roomId, title) => {
    if (!window.confirm(`Are you sure you want to remove the record for room "${title}"?`)) {
      return;
    }
    setActionInProgress(true);
    try {
      const res = await adminDeleteGroupVoiceRoom(roomId);
      showSuccess(res.message || `Room "${title}" record removed.`);
      await fetchRooms();
      if (viewingRoom && viewingRoom.id === roomId) {
        setViewingRoom(null);
      }
    } catch (err) {
      showError(err.message || 'Failed to remove room record.');
    } finally {
      setActionInProgress(false);
    }
  };

  const formatTimestamp = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  // Table columns definition
  const columns = [
    {
      header: 'Room Title & Topic',
      render: (row) => (
        <div style={{ maxWidth: '280px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.title || row.name}>
            {row.title || row.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: 'rgba(167, 139, 250, 0.12)',
              color: '#c4b5fd',
              fontSize: '10px',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <IconTag size={10} />
              {row.topic || 'General'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {row.id}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Host / Creator',
      render: (row) => {
        const host = row.host || {};
        return (
          <div className="avatar-cell">
            <img
              src={host.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{host.fullName || 'Host User'}</span>
              <span className="user-handle">@{host.username || 'host'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Access Type',
      render: (row) => {
        const isInvite = (row.accessType || '').toLowerCase().includes('invite') || (row.accessType || '').toLowerCase().includes('select');
        const invitedCount = (row.invitedUsers && row.invitedUsers.length) || (row.invitedUserIds && row.invitedUserIds.length) || 0;

        if (isInvite) {
          return (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              <IconLock size={12} />
              Selected People ({invitedCount})
            </span>
          );
        }

        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(52, 211, 153, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.28)',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            <IconGlobe size={12} />
            Anyone
          </span>
        );
      }
    },
    {
      header: 'Capacity & Active',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            color: row.status === 'active' ? '#34d399' : 'var(--text-muted)',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <IconMic size={12} />
            {row.participantCount || 0} / {row.capacity || row.maxParticipants || 20}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'active'} />
    },
    {
      header: 'Created Date',
      render: (row) => (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {formatTimestamp(row.createdAt)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
          {/* Read-Only View Details */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setViewingRoom(row)}
            title="View Room Details"
          >
            <IconEye size={15} />
          </button>

          {/* Admin Moderation: Disable Room (if active or scheduled) */}
          {row.status === 'active' || row.status === 'scheduled' ? (
            <button
              type="button"
              className="btn-icon btn-icon-danger"
              onClick={() => handleDisableRoom(row.id, row.title || row.name)}
              disabled={actionInProgress}
              title="Disable / End Room (Moderation)"
            >
              <IconBan size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-icon btn-icon-danger"
              onClick={() => handleRemoveRoom(row.id, row.title || row.name)}
              disabled={actionInProgress}
              title="Remove Room Record"
            >
              <IconTrash size={15} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      {/* Page Header (Clean Read-Only / Monitoring View - No Create Room Button) */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Group Voice Rooms</h1>
          <p className="page-subtitle">
            Monitor user-hosted group audio spaces, room topics, host moderators, access controls, and perform safety moderation.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackAlert && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: feedbackAlert.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${feedbackAlert.type === 'success' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
          color: feedbackAlert.type === 'success' ? '#34d399' : '#f87171'
        }}>
          <IconCheck size={16} />
          <span>{feedbackAlert.message}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171'
        }}>
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Metrics Row (Dynamic counts from backend) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
            Total Rooms
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
            {counts.total}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
            Live Active
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
            {counts.active}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
            Open to Anyone
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#a78bfa', marginTop: '4px' }}>
            {counts.anyone}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
            Invite Only
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>
            {counts.inviteOnly}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ flex: '1 1 300px' }}>
            <SearchBar
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              placeholder="Search rooms by title, topic, or host..."
            />
          </div>

          {/* Filter Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Access Type Filter */}
            <select
              className="select-control"
              value={accessFilter}
              onChange={(e) => {
                setAccessFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: '160px', height: '38px', fontSize: '12px' }}
            >
              <option value="all">All Access Types</option>
              <option value="anyone">Anyone (Open)</option>
              <option value="invite_only">Selected People / Invite Only</option>
            </select>

            {/* Status Filter */}
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: '130px', height: '38px', fontSize: '12px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Live)</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
              <option value="closed">Closed / Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading group voice rooms from server…
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '40px 20px' }}>
            <EmptyState
              title="No Group Voice Rooms Found"
              description="No voice rooms matched your search and filter criteria. Try clearing search filters."
              action={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setAccessFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              }
            />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rooms}
            />
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                pageSize={pageSize}
              />
            </div>
          </>
        )}
      </div>

      {/* View Detail Modal (100% Read-Only) */}
      <GroupVoiceRoomDetailModal
        isOpen={Boolean(viewingRoom)}
        onClose={() => setViewingRoom(null)}
        room={viewingRoom}
      />
    </div>
  );
}
