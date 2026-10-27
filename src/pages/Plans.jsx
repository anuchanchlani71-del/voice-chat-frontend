import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import PlanModal from '../components/modals/PlanModal';
import {
  IconCrown,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
  IconSparkles
} from '../components/common/Icons';
import {
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminUpdatePlanStatus,
  adminDeletePlan
} from '../services/adminApi';

export default function Plans() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const [plansList, setPlansList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Alerts
  const [feedbackAlert, setFeedbackAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null); // id of plan being toggled

  const pageSize = 10;

  // ── Debounce search input ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Fetch plans from backend ───────────────────────────────────
  const loadPlans = useCallback(async (page, search, status) => {
    setIsLoading(true);
    try {
      const res = await adminGetPlans({
        page,
        limit: pageSize,
        search,
        status: status !== 'all' ? status : undefined,
      });

      if (res && res.success) {
        setPlansList(res.plans || res.data || []);
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems ?? res.pagination.total ?? 0);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(res.pagination.currentPage ?? res.pagination.page ?? page);
        }
      }
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: err.message || 'Failed to load subscription plans from server.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // ── Load data on state changes ─────────────────────────────────
  useEffect(() => {
    loadPlans(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter, loadPlans]);

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
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (payload, id) => {
    if (id) {
      const res = await adminUpdatePlan(id, payload);
      if (res && res.success) {
        showSuccess(res.message || 'Subscription plan updated successfully.');
        await loadPlans(currentPage, debouncedSearch, statusFilter);
      }
    } else {
      const res = await adminCreatePlan(payload);
      if (res && res.success) {
        showSuccess(res.message || 'Subscription plan created successfully.');
        setCurrentPage(1);
        await loadPlans(1, debouncedSearch, statusFilter);
      }
    }
  };

  // ── Status Toggle Handler ──────────────────────────────────────
  const handleToggleStatus = async (plan) => {
    const id = plan.id || plan._id;
    if (isTogglingStatus === id) return;

    setIsTogglingStatus(id);
    const nextActive = !plan.isActive;

    try {
      const res = await adminUpdatePlanStatus(id, { isActive: nextActive });
      if (res && res.success) {
        showSuccess(res.message || `Plan ${plan.name} status updated.`);
        await loadPlans(currentPage, debouncedSearch, statusFilter);
      }
    } catch (err) {
      showError(err.message || `Failed to update status for ${plan.name}.`);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  // ── Delete Handlers ────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingPlan || isDeleting) return;

    const id = deletingPlan.id || deletingPlan._id;
    setIsDeleting(true);

    try {
      const res = await adminDeletePlan(id);
      if (res && res.success) {
        showSuccess(res.message || `Plan "${deletingPlan.name}" was deleted successfully.`);
        setDeletingPlan(null);
        const isLastItem = plansList.length === 1 && currentPage > 1;
        const targetPage = isLastItem ? currentPage - 1 : currentPage;
        if (isLastItem) {
          setCurrentPage(targetPage);
        }
        await loadPlans(targetPage, debouncedSearch, statusFilter);
      }
    } catch (err) {
      showError(err.message || `Failed to delete plan "${deletingPlan.name}".`);
      setDeletingPlan(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Columns Definition ─────────────────────────────────────────
  const columns = [
    {
      header: 'Plan / Tier',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
              {row.name}
            </span>
            {row.isDefault && (
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '1px 7px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                ★ Default
              </span>
            )}
            {row.badgeText && (
              <span style={{
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontSize: '11px',
                fontWeight: '600',
                padding: '1px 6px',
                borderRadius: '8px'
              }}>
                {row.badgeText}
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            key: {row.key}
          </span>
          {row.description && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Pricing (INR)',
      render: (row) => {
        const m = row.pricing?.monthly?.amount ?? 0;
        const y = row.pricing?.yearly?.amount ?? 0;
        const curr = row.pricing?.monthly?.currency || 'INR';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {m === 0 ? 'Free' : `₹${m.toLocaleString()} / mo`}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {y === 0 ? 'Free' : `₹${y.toLocaleString()} / yr`}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Room & Audio Limits',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Max Capacity: <strong style={{ color: 'var(--text-primary)' }}>{row.limits?.maxGroupRoomCapacity ?? 10}</strong></span>
          <span>Audio: <strong style={{ color: 'var(--text-primary)' }}>{row.limits?.audioBitrateKbps ?? 64} kbps</strong></span>
          <span>Daily Calls: <strong style={{ color: 'var(--text-primary)' }}>{row.limits?.maxDailyCallMinutes === 0 ? 'Unlimited' : `${row.limits?.maxDailyCallMinutes}m`}</strong></span>
        </div>
      )
    },
    {
      header: 'Order',
      align: 'center',
      render: (row) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          #{row.displayOrder ?? 0}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const id = row.id || row._id;
        const isToggling = isTogglingStatus === id;
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
            {/* Status toggle button */}
            <button
              type="button"
              className={`btn btn-xs ${row.isActive ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleToggleStatus(row)}
              disabled={isToggling}
              title={row.isActive ? 'Deactivate plan' : 'Activate plan'}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {isToggling ? '…' : (row.isActive ? 'Deactivate' : 'Activate')}
            </button>

            {/* Edit button */}
            <button
              type="button"
              className="btn-icon-only"
              onClick={() => handleOpenEdit(row)}
              title="Edit plan configuration"
            >
              <IconEdit size={16} />
            </button>

            {/* Delete button (with safety note if default) */}
            <button
              type="button"
              className="btn-icon-only"
              onClick={() => setDeletingPlan(row)}
              disabled={row.isDefault || row.key === 'free'}
              style={{
                color: (row.isDefault || row.key === 'free') ? 'var(--text-disabled, #666)' : 'var(--danger-500)',
                cursor: (row.isDefault || row.key === 'free') ? 'not-allowed' : 'pointer',
                opacity: (row.isDefault || row.key === 'free') ? 0.4 : 1
              }}
              title={(row.isDefault || row.key === 'free') ? 'Default Free tier is protected and cannot be deleted' : 'Delete plan'}
            >
              <IconTrash size={16} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconCrown size={28} style={{ color: 'var(--primary-500)' }} />
            Plans
          </h1>
          <p className="page-desc">
            Define and manage subscription tiers, voice bitrates, participant capacity limits, and package pricing.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenCreate}
        >
          <IconPlus size={16} />
          Create Plan
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
          Loading subscription plans from server…
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
            placeholder="Search plans by name, key, or description..."
          />

          <FilterBar>
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={plansList}
          emptyComponent={
            <EmptyState
              icon={IconCrown}
              title="No subscription plans found"
              description="No subscription plans match your search or filter parameters."
              actionText="Create New Plan"
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

      {/* Add / Edit Plan Modal */}
      <PlanModal
        planData={editingPlan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
      />

      {/* Delete Confirmation Modal */}
      {deletingPlan && (
        <Modal
          isOpen={Boolean(deletingPlan)}
          onClose={() => setDeletingPlan(null)}
          title="Confirm Plan Deletion"
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletingPlan(null)}
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
                {isDeleting ? 'Deleting…' : 'Delete Plan Permanently'}
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
              Are you sure you want to delete the plan <strong>"{deletingPlan.name}"</strong> (<code>{deletingPlan.key}</code>)?
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              This operation cannot be undone. Users currently assigned to this tier will lose their tier configuration.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
