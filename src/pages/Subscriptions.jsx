import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import {
  IconCreditCard,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
  IconUsers
} from '../components/common/Icons';
import {
  adminGetSubscriptions,
  adminCreateSubscription,
  adminUpdateSubscription,
  adminDeleteSubscription,
  adminGetPlans
} from '../services/adminApi';

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Alerts
  const [feedbackAlert, setFeedbackAlert] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [deletingSub, setDeletingSub] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  // ── Debounce search input ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Load available plans for filter dropdown ───────────────────
  useEffect(() => {
    adminGetPlans({ limit: 100 })
      .then((res) => {
        if (res && Array.isArray(res.plans)) {
          setAvailablePlans(res.plans);
        }
      })
      .catch((err) => {
        console.error('Failed to load plans for filter:', err);
      });
  }, []);

  // ── Fetch subscriptions from backend ───────────────────────────
  const loadSubscriptions = useCallback(async (page, search, status, plan) => {
    setIsLoading(true);
    try {
      const res = await adminGetSubscriptions({
        page,
        limit: pageSize,
        search,
        status: status !== 'all' ? status : undefined,
        plan: plan !== 'all' ? plan : undefined
      });

      if (res && res.success) {
        setSubscriptionsList(res.subscriptions || res.data || []);
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems ?? res.pagination.total ?? 0);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(res.pagination.currentPage ?? res.pagination.page ?? page);
        }
      }
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: err.message || 'Failed to load subscriptions from server.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // ── Load data on state changes ─────────────────────────────────
  useEffect(() => {
    loadSubscriptions(currentPage, debouncedSearch, statusFilter, planFilter);
  }, [currentPage, debouncedSearch, statusFilter, planFilter, loadSubscriptions]);

  // ── Feedback helpers ───────────────────────────────────────────
  const showSuccess = (msg) => {
    setFeedbackAlert({ type: 'success', message: msg });
    setTimeout(() => {
      setFeedbackAlert((prev) => (prev && prev.type === 'success' && prev.message === msg ? null : prev));
    }, 4000);
  };

  const showError = (msg) => {
    setFeedbackAlert({ type: 'error', message: msg });
  };

  // ── Create & Edit Handlers ─────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleSaveSubscription = async (payload, id) => {
    if (id) {
      const res = await adminUpdateSubscription(id, payload);
      if (res && res.success) {
        showSuccess(res.message || 'Subscription updated successfully.');
        await loadSubscriptions(currentPage, debouncedSearch, statusFilter, planFilter);
      }
    } else {
      const res = await adminCreateSubscription(payload);
      if (res && res.success) {
        showSuccess(res.message || 'Subscription created successfully.');
        setCurrentPage(1);
        await loadSubscriptions(1, debouncedSearch, statusFilter, planFilter);
      }
    }
  };

  // ── Delete Handlers ────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingSub || isDeleting) return;

    const id = deletingSub.id || deletingSub._id;
    setIsDeleting(true);

    try {
      const res = await adminDeleteSubscription(id);
      if (res && res.success) {
        showSuccess(res.message || 'Subscription record deleted successfully.');
        setDeletingSub(null);
        const isLastItem = subscriptionsList.length === 1 && currentPage > 1;
        const targetPage = isLastItem ? currentPage - 1 : currentPage;
        if (isLastItem) {
          setCurrentPage(targetPage);
        }
        await loadSubscriptions(targetPage, debouncedSearch, statusFilter, planFilter);
      }
    } catch (err) {
      showError(err.message || 'Failed to delete subscription record.');
      setDeletingSub(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Date formatter helper ──────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  // ── Columns Definition ─────────────────────────────────────────
  const columns = [
    {
      header: 'User',
      render: (row) => {
        const u = row.user || {};
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={u.fullName || 'User'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border-color)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {u.fullName || u.username || 'Unknown User'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                @{u.username || 'username'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Email',
      render: (row) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {row.user?.email || '—'}
        </span>
      )
    },
    {
      header: 'Plan',
      render: (row) => {
        const p = row.plan || {};
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>
              {p.name || row.planKey || 'Plan'}
            </span>
            {p.badgeText && (
              <span style={{
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '1px 5px',
                borderRadius: '6px'
              }}>
                {p.badgeText}
              </span>
            )}
            {p.isDefault && (
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '1px 5px',
                borderRadius: '6px'
              }}>
                [Default]
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'active'} />
    },
    {
      header: 'Start Date',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {formatDate(row.startDate)}
        </span>
      )
    },
    {
      header: 'End Date',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: row.endDate ? 'var(--text-secondary)' : 'var(--success-500, #4ade80)' }}>
          {row.endDate ? formatDate(row.endDate) : 'Ongoing / Perpetual'}
        </span>
      )
    },
    {
      header: 'Created',
      render: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => handleOpenEdit(row)}
            title="Edit subscription"
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => setDeletingSub(row)}
            style={{ color: 'var(--danger-500)' }}
            title="Delete subscription record"
          >
            <IconTrash size={16} />
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
            <IconCreditCard size={28} style={{ color: 'var(--primary-500)' }} />
            Subscriptions
          </h1>
          <p className="page-desc">
            Manage user subscription assignments, active memberships, and expiration dates.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenCreate}
        >
          <IconPlus size={16} />
          Create Subscription
        </button>
      </div>

      {/* Loading feedback */}
      {isLoading && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(135, 124, 169, 0.10)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-color-light)',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Loading user subscriptions from server…
        </div>
      )}

      {/* Success alert */}
      {feedbackAlert && feedbackAlert.type === 'success' && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--success-50, rgba(34, 197, 94, 0.1))',
          border: '1px solid var(--success-500, #22c55e)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success-700, #4ade80)',
          marginBottom: '20px',
          fontWeight: '600',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IconCheck size={16} />
          {feedbackAlert.message}
        </div>
      )}

      {/* Error alert */}
      {feedbackAlert && feedbackAlert.type === 'error' && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          marginBottom: '20px',
          fontWeight: '600',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IconAlertTriangle size={16} />
          <span>{feedbackAlert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
            placeholder="Search by user name, email, or plan..."
          />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterBar>
              <select
                className="select-control"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </FilterBar>

            <FilterBar>
              <select
                className="select-control"
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Plans</option>
                {availablePlans.map((p) => (
                  <option key={p.id || p._id || p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FilterBar>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={subscriptionsList}
          emptyComponent={
            <EmptyState
              icon={IconCreditCard}
              title="No subscriptions found"
              description="No user subscriptions match your selected filter criteria."
              actionText="Create Subscription"
              onAction={handleOpenCreate}
            />
          }
        />

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>

      {/* Add / Edit Subscription Modal */}
      <SubscriptionModal
        subscriptionData={editingSub}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscription}
      />

      {/* Delete Confirmation Modal */}
      {deletingSub && (
        <Modal
          isOpen={Boolean(deletingSub)}
          onClose={() => setDeletingSub(null)}
          title="Confirm Subscription Deletion"
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletingSub(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          }
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--danger-500)' }}>
              <IconAlertTriangle size={24} />
              <strong style={{ fontSize: '15px' }}>Warning: Permanent Action</strong>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Are you sure you want to delete the subscription for user <strong>"{deletingSub.user?.fullName || deletingSub.user?.username}"</strong> on plan <strong>"{deletingSub.plan?.name || deletingSub.planKey}"</strong>?
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              This operation will permanently remove this subscription record from the database.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
