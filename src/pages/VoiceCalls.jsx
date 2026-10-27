import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import CallDetailModal from '../components/modals/CallDetailModal';
import { IconPhoneCall, IconEye, IconClock, IconMic } from '../components/common/Icons';
import { adminGetVoiceCalls } from '../services/adminApi';

export default function VoiceCalls() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [voiceCallsList, setVoiceCallsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const pageSize = 6;

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetVoiceCalls({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter
      });

      if (res && res.voiceCalls) {
        setVoiceCallsList(res.voiceCalls);
        setTotalItems(res.pagination?.totalItems ?? res.voiceCalls.length);
      } else if (res && res.data) {
        setVoiceCallsList(res.data);
        setTotalItems(res.pagination?.totalItems ?? res.data.length);
      } else {
        setVoiceCallsList([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Failed to load voice calls:', err);
      setError(err.message || 'Failed to load voice call logs.');
      setVoiceCallsList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const formatCallTimestamp = (val) => {
    if (!val) return '—';
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  const columns = [
    {
      header: 'Call ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', background: 'var(--slate-100)', padding: '3px 6px', borderRadius: '4px' }}>
          {row.id}
        </span>
      )
    },
    {
      header: 'Caller (Initiated)',
      render: (row) => {
        const caller = row.caller || {};
        return (
          <div className="avatar-cell">
            <img
              src={caller.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{caller.fullName || 'Caller'}</span>
              <span className="user-handle">@{caller.username || 'caller'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Receiver (Target Friend)',
      render: (row) => {
        const receiver = row.receiver || {};
        return (
          <div className="avatar-cell">
            <img
              src={receiver.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{receiver.fullName || 'Receiver'}</span>
              <span className="user-handle">@{receiver.username || 'receiver'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Call Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Duration',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--slate-900)' }}>
          <IconClock size={14} style={{ color: 'var(--slate-400)' }} />
          <span>{row.durationFormatted || '0m 00s'}</span>
        </div>
      )
    },
    {
      header: 'End Reason',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
          {row.endReason || 'Normal Hangup'}
        </span>
      )
    },
    {
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
          {formatCallTimestamp(row.startedAt || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedCall(row)}
          title="Inspect Call Telemetry"
        >
          <IconEye size={14} />
          Details
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
            <IconPhoneCall size={28} style={{ color: 'var(--primary-500)' }} />
            1-to-1 Voice Chat Activity
          </h1>
          <p className="page-desc">
            Complete audit trail of private 1-to-1 voice calls between connected friends.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="header-pill">
            <IconMic size={14} />
            Opus Codec 48kbps P2P Mesh
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchCalls}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
            placeholder="Search by user or Call ID..."
          />

          <FilterBar>
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Call Outcomes</option>
              <option value="completed">Completed Calls</option>
              <option value="missed">Missed Calls</option>
              <option value="declined">Declined Calls</option>
              <option value="failed">Failed / Connection Drops</option>
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading && voiceCallsList.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading voice call logs...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={voiceCallsList}
            emptyComponent={
              <EmptyState
                title="No voice call logs found"
                description="No voice sessions match the selected filter criteria."
                actionText="Reset Filters"
                onAction={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
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

      {/* Call Details Modal */}
      <CallDetailModal
        call={selectedCall}
        isOpen={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />
    </div>
  );
}

