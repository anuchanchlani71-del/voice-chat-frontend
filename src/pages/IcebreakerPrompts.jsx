import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import IcebreakerModal from '../components/modals/IcebreakerModal';
import {
  IconSparkles,
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconTag,
  IconMic,
  IconCheck
} from '../components/common/Icons';
import {
  adminGetIcebreakerPrompts,
  adminCreateIcebreakerPrompt,
  adminUpdateIcebreakerPrompt,
  adminDeleteIcebreakerPrompt
} from '../services/adminApi';

const INTEREST_FILTER_OPTIONS = [
  'All Interests',
  'Movies',
  'Gaming',
  'Music',
  'Books',
  'Fitness',
  'Language Practice',
  'General'
];

const INTEREST_ICONS = {
  Movies: '🎬',
  Gaming: '🎮',
  Music: '🎵',
  Books: '📚',
  Fitness: '🏃',
  'Language Practice': '🗣️',
  General: '✨'
};

export default function IcebreakerPrompts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('All Interests');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [promptsList, setPromptsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackAlert, setFeedbackAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [deletingPrompt, setDeletingPrompt] = useState(null);

  const pageSize = 6;

  // ── Debounce search input to avoid excessive requests ──────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Fetch prompts from backend ─────────────────────────────────
  const loadPrompts = useCallback(async (page, search, interest, status) => {
    setIsLoading(true);
    try {
      const res = await adminGetIcebreakerPrompts({
        page,
        limit: pageSize,
        search,
        interest,
        status,
      });

      if (res && res.success) {
        setPromptsList(res.prompts || res.data || []);
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems ?? res.pagination.total ?? 0);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(res.pagination.currentPage ?? res.pagination.page ?? page);
        }
      }
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: err.message || 'Failed to load icebreaker prompts from server.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // ── Load data on state changes ─────────────────────────────────
  useEffect(() => {
    loadPrompts(currentPage, debouncedSearch, interestFilter, statusFilter);
  }, [currentPage, debouncedSearch, interestFilter, statusFilter, loadPrompts]);

  // ── Feedback helpers ───────────────────────────────────────────
  const showSuccess = (msg) => {
    setFeedbackAlert({ type: 'success', message: msg });
    setTimeout(() => {
      setFeedbackAlert((prev) => (prev && prev.type === 'success' && prev.message === msg ? null : prev));
    }, 3500);
  };

  const showError = (msg) => {
    setFeedbackAlert({ type: 'error', message: msg });
  };

  // ── Action Handlers ────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promptItem) => {
    setEditingPrompt(promptItem);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (promptItem) => {
    setDeletingPrompt(promptItem);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrompt) return;

    setIsDeleting(true);
    const id = deletingPrompt.id || deletingPrompt._id;
    try {
      const res = await adminDeleteIcebreakerPrompt(id);
      if (res && res.success) {
        showSuccess(res.message || 'Icebreaker prompt deleted successfully.');
        setDeletingPrompt(null);
        const isLastItemOnPage = promptsList.length === 1 && currentPage > 1;
        const targetPage = isLastItemOnPage ? currentPage - 1 : currentPage;
        if (isLastItemOnPage) {
          setCurrentPage(targetPage);
        }
        await loadPrompts(targetPage, debouncedSearch, interestFilter, statusFilter);
      }
    } catch (err) {
      showError(err.message || 'Failed to delete icebreaker prompt.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePrompt = async (payload, id) => {
    if (id) {
      const res = await adminUpdateIcebreakerPrompt(id, payload);
      if (res && res.success) {
        showSuccess(res.message || 'Icebreaker prompt updated successfully.');
        await loadPrompts(currentPage, debouncedSearch, interestFilter, statusFilter);
      }
    } else {
      const res = await adminCreateIcebreakerPrompt(payload);
      if (res && res.success) {
        showSuccess(res.message || 'Icebreaker prompt created successfully.');
        setCurrentPage(1);
        await loadPrompts(1, debouncedSearch, interestFilter, statusFilter);
      }
    }
  };

  // Helper to format date
  const formatTimestamp = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateVal;
    }
  };

  // Table Column Definitions
  const columns = [
    {
      header: 'Interest',
      render: (row) => {
        const icon = INTEREST_ICONS[row.interest] || '🏷️';
        const isGeneral = row.interest === 'General';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '16px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isGeneral ? 'rgba(135, 124, 169, 0.16)' : 'var(--slate-100)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {icon}
            </span>
            <span
              className={`tag-pill ${isGeneral ? 'tag-primary' : ''}`}
              style={{
                fontWeight: '700',
                fontSize: '13px',
                letterSpacing: '0.01em'
              }}
            >
              #{row.interest}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Prompt',
      render: (row) => (
        <div style={{ maxWidth: '420px' }}>
          <span style={{ fontWeight: '600', color: 'var(--slate-800)', fontSize: '13.5px', lineHeight: '1.45' }}>
            &ldquo;{row.prompt}&rdquo;
          </span>
          {row.interest === 'General' && (
            <div style={{ fontSize: '11px', color: 'var(--accent-color-light)', marginTop: '2px', fontWeight: '500' }}>
              ✦ Fallback starter for peers with no mutual tags
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} label={row.status === 'active' ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Updated',
      render: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--slate-400)', fontWeight: '500' }}>
          {formatTimestamp(row.updatedAt || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => handleOpenEdit(row)}
            title="Edit icebreaker prompt"
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => handleOpenDelete(row)}
            style={{ color: 'var(--danger-500)' }}
            title="Delete icebreaker prompt"
          >
            <IconTrash size={16} />
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
            <IconSparkles size={28} style={{ color: 'var(--primary-500)' }} />
            Icebreaker Prompts
          </h1>
          <p className="page-desc">
            Manage conversation prompts that can be used during voice calls based on shared interests.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenCreate}
        >
          <IconPlus size={16} />
          Add Prompt
        </button>
      </div>

      {/* Info Notice Card */}
      <div
        style={{
          background: 'var(--accent-50)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <IconMic size={18} style={{ color: 'var(--accent-color-light)', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: '1.4' }}>
          <strong style={{ color: 'var(--slate-900)' }}>Voice Call Prompt Matching:</strong> When two friends connect on a 1-to-1 voice call, the engine selects an active prompt corresponding to their mutual interest tags. If no common tags exist, a <span style={{ color: 'var(--accent-color-light)', fontWeight: '700' }}>General</span> fallback prompt is delivered.
        </div>
      </div>

      {/* Loading feedback notification */}
      {isLoading && (
        <div style={{ padding: '10px 16px', background: 'rgba(135, 124, 169, 0.10)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color-light)', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          Loading icebreaker prompts from server…
        </div>
      )}

      {/* Success feedback notification */}
      {feedbackAlert && feedbackAlert.type === 'success' && (
        <div style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-700)', marginBottom: '20px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCheck size={16} />
          {feedbackAlert.message}
        </div>
      )}

      {/* Error feedback notification */}
      {feedbackAlert && feedbackAlert.type === 'error' && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '20px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠</span>
          {feedbackAlert.message}
        </div>
      )}

      {/* Filter and Search Area */}
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
            placeholder="Search icebreaker prompt..."
          />

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <FilterBar>
              {/* Interest Filter */}
              <select
                className="select-control"
                value={interestFilter}
                onChange={(e) => {
                  setInterestFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by Interest"
              >
                {INTEREST_FILTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FilterBar>
          </div>
        </div>
      </div>

      {/* Prompts Table Card */}
      <div className="card">
        <DataTable
          columns={columns}
          data={promptsList}
          emptyComponent={
            <EmptyState
              icon={IconSparkles}
              title="No icebreaker prompts found"
              description="No prompts match your current search query or filter criteria."
              actionText="Add New Prompt"
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

      {/* Add / Edit Prompt Modal */}
      <IcebreakerModal
        promptData={editingPrompt}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingPrompt)}
        onClose={() => !isDeleting && setDeletingPrompt(null)}
        title="Delete Icebreaker Prompt"
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setDeletingPrompt(null)}
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
              {isDeleting ? 'Deleting…' : 'Delete Prompt'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--danger-50)',
              color: 'var(--danger-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <IconAlertTriangle size={20} />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--slate-800)', margin: '0 0 8px 0', fontWeight: '600' }}>
              Delete this icebreaker prompt?
            </p>
            {deletingPrompt && (
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--slate-400)',
                  margin: 0,
                  fontStyle: 'italic',
                  background: 'var(--slate-100)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                &ldquo;{deletingPrompt.prompt}&rdquo;
              </p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '8px', marginBottom: 0 }}>
              This action will remove the prompt from the active voice call icebreaker rotation.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

