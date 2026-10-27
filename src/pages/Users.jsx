import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '../router';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import UserDetailModal from '../components/modals/UserDetailModal';
import { IconUsers, IconEye } from '../components/common/Icons';
import {
  adminGetUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminGetInterests
} from '../services/adminApi';

export default function Users() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interestFilter, setInterestFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [interests, setInterests] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 6;

  // Load available interests for filter dropdown
  useEffect(() => {
    adminGetInterests({ limit: 100, isActive: true })
      .then((res) => {
        if (res && Array.isArray(res.interests)) {
          setInterests(res.interests);
        }
      })
      .catch(() => {
        // Non-fatal if interests dropdown cannot load
      });
  }, []);

  // Fetch users from backend API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetUsers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        online: onlineFilter,
        status: statusFilter,
        interest: interestFilter
      });

      if (res && res.success) {
        setUsers(res.users || []);
        setTotalItems(res.pagination?.totalItems ?? (res.users || []).length);
      } else {
        setUsers([]);
        setTotalItems(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load user profiles from server.');
      setUsers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, onlineFilter, statusFilter, interestFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle URL ID parameter for opening user details
  useEffect(() => {
    if (id) {
      adminGetUserById(id)
        .then((res) => {
          if (res && res.user) {
            setSelectedUser(res.user);
          }
        })
        .catch(() => {
          // If not found via API, clear selection
          setSelectedUser(null);
        });
    }
  }, [id]);

  // Handle status update from modal
  const handleStatusChange = async (userId, nextStatus) => {
    const res = await adminUpdateUserStatus(userId, { accountStatus: nextStatus });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId || u._id === userId ? { ...u, accountStatus: nextStatus } : u))
    );
    if (selectedUser && (selectedUser.id === userId || selectedUser._id === userId)) {
      setSelectedUser((prev) => ({ ...prev, accountStatus: nextStatus }));
    }
    return res.user;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setOnlineFilter('all');
    setStatusFilter('all');
    setInterestFilter('all');
    setCurrentPage(1);
  };

  const columns = [
    {
      header: 'User Profile',
      render: (row) => (
        <div className="avatar-cell">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={row.fullName || row.username}
            className="user-avatar"
          />
          <div className="user-names">
            <span className="user-fullname">{row.fullName || row.username}</span>
            <span className="user-handle">@{row.username}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Interest Tags (Discovery)',
      render: (row) => {
        const rowInterests = Array.isArray(row.interests) ? row.interests : [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '240px' }}>
            {rowInterests.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag-pill tag-primary">
                #{tag}
              </span>
            ))}
            {rowInterests.length > 3 && (
              <span className="tag-pill">+{rowInterests.length - 3}</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Presence',
      render: (row) => (
        <div>
          <StatusBadge status={row.isOnline ? 'Online' : 'Offline'} />
          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {row.lastSeen || 'Unknown'}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.accountStatus || 'active'} />
    },
    {
      header: 'Social & Calls',
      render: (row) => (
        <div style={{ fontSize: '12.5px' }}>
          <div><strong style={{ color: 'var(--slate-900)' }}>{row.friendsCount ?? 0}</strong> friends</div>
          <div style={{ color: 'var(--primary-700)', fontWeight: '600' }}>{row.voiceCallsCount ?? 0} voice calls</div>
        </div>
      )
    },
    {
      header: 'Joined',
      accessor: 'joinedDate',
      render: (row) => row.joinedDate || 'Recently'
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedUser(row)}
            title="View full user details & history"
          >
            <IconEye size={14} />
            Details
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
            <IconUsers size={28} style={{ color: 'var(--primary-500)' }} />
            User Management
          </h1>
          <p className="page-desc">
            Manage user accounts, interest profiles, online presence, and 1-to-1 voice permissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="header-pill">
            Total: {totalItems} {totalItems === 1 ? 'Profile' : 'Profiles'}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
            placeholder="Search username, name, bio..."
          />

          <FilterBar>
            {/* Online Filter */}
            <select
              className="select-control"
              value={onlineFilter}
              onChange={(e) => { setOnlineFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Presence</option>
              <option value="online">Online Only (Active)</option>
              <option value="offline">Offline</option>
            </select>

            {/* Account Status Filter */}
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Interest Filter */}
            <select
              className="select-control"
              value={interestFilter}
              onChange={(e) => { setInterestFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Interests</option>
              {interests.map((item) => (
                <option key={item.id || item._id} value={item.name}>
                  {item.icon ? `${item.icon} ` : ''}{item.name}
                </option>
              ))}
            </select>
          </FilterBar>
        </div>
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchUsers}>
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        {loading && users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading user profiles...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            emptyComponent={
              <EmptyState
                title="No users match your criteria"
                description="No user profiles found with the selected search terms or filters."
                actionText="Reset Filters"
                onAction={resetFilters}
              />
            }
          />
        )}

        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* User Details Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onStatusChange={handleStatusChange}
        onClose={() => {
          setSelectedUser(null);
          if (id) navigate('/users');
        }}
      />
    </div>
  );
}

