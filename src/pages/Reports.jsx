import React, { useState, useEffect, useCallback } from 'react';
import Tabs from '../components/common/Tabs';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ReportDetailModal from '../components/modals/ReportDetailModal';
import { IconShieldAlert, IconEye, IconCheck } from '../components/common/Icons';
import { adminGetReports, adminGetReportById } from '../services/adminApi';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, resolved: 0, dismissed: 0 });
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 6;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetReports({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: activeTab
      });

      if (res && res.success) {
        setReports(res.reports || []);
        if (res.counts) {
          setCounts(res.counts);
        }
        setTotalItems(res.pagination?.totalItems ?? (res.reports || []).length);
      } else {
        setReports([]);
        setTotalItems(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load moderation reports.');
      setReports([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, activeTab]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tabs = [
    { id: 'all', label: 'All Reports', count: counts.all ?? 0 },
    { id: 'pending', label: 'Pending Review', count: counts.pending ?? 0 },
    { id: 'resolved', label: 'Resolved', count: counts.resolved ?? 0 },
    { id: 'dismissed', label: 'Dismissed', count: counts.dismissed ?? 0 }
  ];

  const handleReview = async (row) => {
    try {
      const identifier = row.id || row._id;
      const res = await adminGetReportById(identifier);
      setSelectedReport(res?.report || row);
    } catch {
      setSelectedReport(row);
    }
  };

  const handleActionSuccess = () => {
    fetchReports();
  };

  const columns = [
    {
      header: 'Report ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', background: 'var(--slate-100)', padding: '3px 6px', borderRadius: '4px' }}>
          {row.id || row._id}
        </span>
      )
    },
    {
      header: 'Reported User (Accused)',
      render: (row) => {
        const reportedUser = row.reportedUser || {};
        return (
          <div className="avatar-cell">
            <img
              src={reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{reportedUser.fullName || reportedUser.username || 'Unknown User'}</span>
              <span className="user-handle" style={{ color: 'var(--danger-700)', fontWeight: '600' }}>
                @{reportedUser.username || 'user'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Reporter (Complainant)',
      render: (row) => {
        const reporter = row.reporter || {};
        return (
          <div className="avatar-cell">
            <img
              src={reporter.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="user-avatar"
            />
            <div className="user-names">
              <span className="user-fullname">{reporter.fullName || reporter.username || 'Unknown User'}</span>
              <span className="user-handle">@{reporter.username || 'user'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Reason Category',
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--slate-800)', fontSize: '13px' }}>
          {row.reasonCategory || row.reason || 'General Violation'}
        </span>
      )
    },
    {
      header: 'Report Date',
      accessor: 'date',
      render: (row) => row.date || row.createdAt?.substring(0, 10) || 'Recently'
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'pending'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleReview(row)}
            title="Review full evidence & take action"
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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconShieldAlert size={28} style={{ color: 'var(--danger-500)' }} />
            Moderation Reports
          </h1>
          <p className="page-desc">
            Review user-submitted reports regarding voice call behavior, unwanted friend requests, or profile violations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-pending">
            {counts.pending ?? 0} Actionable Reports
          </span>
        </div>
      </div>

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
          placeholder="Search by Report ID, user, or reason category..."
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-500)',
            color: 'var(--danger-700)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchReports}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading && reports.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading moderation reports...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            emptyComponent={
              <EmptyState
                icon={IconCheck}
                title="No reports in this queue"
                description="All reported incidents in this status category have been addressed."
                actionText="View All Reports"
                onAction={() => {
                  setActiveTab('all');
                  setSearchTerm('');
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

      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={Boolean(selectedReport)}
        onActionSuccess={handleActionSuccess}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

