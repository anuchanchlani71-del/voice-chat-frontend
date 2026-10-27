import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import InterestModal from '../components/modals/InterestModal';
import { IconTag, IconPlus, IconEdit, IconTrash, IconCheck } from '../components/common/Icons';
import {
  adminGetInterests,
  adminCreateInterest,
  adminUpdateInterest,
  adminDeleteInterest
} from '../services/adminApi';

export default function Interests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [interestsList, setInterestsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [feedbackAlert, setFeedbackAlert] = useState(null); // { type: 'success' | 'error', message: string }
  const pageSize = 8;

  // ── Debounce search input to avoid spamming the backend ────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Fetch interests from backend ───────────────────────────────
  const loadInterests = useCallback(async (page, search, category) => {
    setIsLoading(true);
    try {
      const res = await adminGetInterests({
        page,
        limit: pageSize,
        search,
        category: category !== 'all' ? category : undefined,
      });

      if (res && res.success) {
        setInterestsList(res.interests || []);
        if (res.categories && Array.isArray(res.categories)) {
          setCategoriesList(res.categories);
        }
        if (res.pagination) {
          setTotalItems(res.pagination.totalItems || 0);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(res.pagination.currentPage || page);
        }
      }
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: err.message || 'Failed to load interest tags from server.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // ── Load data when page, search, or category filter changes ────
  useEffect(() => {
    loadInterests(currentPage, debouncedSearch, categoryFilter);
  }, [currentPage, debouncedSearch, categoryFilter, loadInterests]);

  const categories = useMemo(() => {
    if (categoriesList.length > 0) return categoriesList;
    const set = new Set(interestsList.map((i) => i.category).filter(Boolean));
    return Array.from(set);
  }, [categoriesList, interestsList]);

  // ── Feedback helper ────────────────────────────────────────────
  const showSuccess = (msg) => {
    setFeedbackAlert({ type: 'success', message: msg });
    setTimeout(() => {
      setFeedbackAlert((prev) => (prev && prev.type === 'success' && prev.message === msg ? null : prev));
    }, 3500);
  };

  const showError = (msg) => {
    setFeedbackAlert({ type: 'error', message: msg });
  };

  // ── Modal Handlers ─────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingInterest(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (interest) => {
    setEditingInterest(interest);
    setIsModalOpen(true);
  };

  const handleSaveInterest = async (payload, id) => {
    if (id) {
      const res = await adminUpdateInterest(id, payload);
      if (res && res.success) {
        showSuccess(res.message || 'Interest tag updated successfully.');
        await loadInterests(currentPage, debouncedSearch, categoryFilter);
      }
    } else {
      const res = await adminCreateInterest(payload);
      if (res && res.success) {
        showSuccess(res.message || 'Interest tag created successfully.');
        setCurrentPage(1);
        await loadInterests(1, debouncedSearch, categoryFilter);
      }
    }
  };

  // ── Delete Handler ─────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    const label = name ? `"#${name}"` : 'this interest tag';
    if (!window.confirm(`Delete ${label} from the platform catalog?`)) {
      return;
    }

    try {
      const res = await adminDeleteInterest(id);
      if (res && res.success) {
        showSuccess(res.message || `Interest tag ${label} deleted successfully from catalog.`);
        const isLastItemOnPage = interestsList.length === 1 && currentPage > 1;
        const targetPage = isLastItemOnPage ? currentPage - 1 : currentPage;
        if (isLastItemOnPage) {
          setCurrentPage(targetPage);
        }
        await loadInterests(targetPage, debouncedSearch, categoryFilter);
      }
    } catch (err) {
      showError(err.message || `Failed to delete ${label}.`);
    }
  };

  const columns = [
    {
      header: 'Interest Tag',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-100)', borderRadius: 'var(--radius-sm)' }}>
            {row.icon || '✨'}
          </span>
          <span style={{ fontWeight: '700', color: 'var(--slate-900)', fontSize: '14px' }}>
            #{row.name}
          </span>
        </div>
      )
    },
    {
      header: 'Category Group',
      accessor: 'category'
    },
    {
      header: 'Matched Users Count',
      render: (row) => (
        <span style={{ fontWeight: '700', color: 'var(--primary-700)', fontFamily: 'monospace' }}>
          {(row.userCount || 0).toLocaleString()} users
        </span>
      )
    },
    {
      header: 'Catalog Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />
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
            title="Edit interest metadata"
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => handleDelete(row.id || row._id, row.name)}
            style={{ color: 'var(--danger-500)' }}
            title="Delete interest tag"
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
            <IconTag size={28} style={{ color: 'var(--primary-500)' }} />
            Interests &amp; Discovery Tags
          </h1>
          <p className="page-desc">
            Manage the taxonomy of interest tags used to match people in Discovery and power friend connections.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenCreate}
        >
          <IconPlus size={16} />
          Add Interest Tag
        </button>
      </div>

      {/* Loading feedback notification */}
      {isLoading && (
        <div style={{ padding: '10px 16px', background: 'rgba(135, 124, 169, 0.10)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color-light)', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          Loading interest tags from server…
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

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
            placeholder="Search interest tag by name..."
          />

          <FilterBar>
            <select
              className="select-control"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </FilterBar>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={interestsList}
          emptyComponent={
            <EmptyState
              icon={IconTag}
              title="No interest tags found"
              description="No tags match the selected criteria."
              actionText="Add New Tag"
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

      {/* Add / Edit Modal */}
      <InterestModal
        interest={editingInterest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInterest}
      />
    </div>
  );
}

