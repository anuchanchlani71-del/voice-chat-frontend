import React, { useState, useEffect } from 'react';
import { IconCheck, IconShield } from '../components/common/Icons';
import Modal from '../components/common/Modal';
import { adminGetMe, adminUpdateMe, adminChangePassword } from '../services/adminApi';
import { useAdmin } from '../context/AdminContext';

// Inline User & Mail & Eye icons for clean self-containment
function IconUserCircle({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconEyeOn({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function AdminProfile() {
  const { admin: sharedAdmin, updateAdmin } = useAdmin();

  const fallbackData = {
    fullName: 'Admin Team',
    email: 'admin@voicefriends.io',
    role: 'Super Admin',
    accountType: 'Primary Administrator',
    initials: 'AD',
  };

  const [loadedData, setLoadedData] = useState(() => {
    if (sharedAdmin) {
      const dynamicInitials = sharedAdmin.initials || (sharedAdmin.name ? sharedAdmin.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AD');
      return {
        fullName: sharedAdmin.name || fallbackData.fullName,
        email: sharedAdmin.email || fallbackData.email,
        role: sharedAdmin.role || fallbackData.role,
        accountType: fallbackData.accountType,
        initials: dynamicInitials,
      };
    }
    return { ...fallbackData };
  });

  const [formData, setFormData] = useState({ ...loadedData });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ── Password Modal States ──────────────────────────────────────────
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Sync initial profile from shared admin or API on mount ──────────
  useEffect(() => {
    let isMounted = true;
    adminGetMe()
      .then((res) => {
        if (isMounted && res && res.success && res.admin) {
          const admin = res.admin;
          const dynamicInitials = admin.initials || (admin.name ? admin.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AD');
          const data = {
            fullName: admin.name || fallbackData.fullName,
            email: admin.email || fallbackData.email,
            role: admin.role || fallbackData.role,
            accountType: fallbackData.accountType,
            initials: dynamicInitials,
          };
          setLoadedData(data);
          setFormData(data);
          updateAdmin(admin);
        }
      })
      .catch(() => {
        // Retain fallback data gracefully if fetch fails
      });
    return () => {
      isMounted = false;
    };
  }, [updateAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return; // Prevent duplicate submissions

    setErrorMessage('');
    setSuccessMessage('');

    // Client-side input validation
    const trimmedName = formData.fullName ? formData.fullName.trim() : '';
    const trimmedEmail = formData.email ? formData.email.trim().toLowerCase() : '';

    if (!trimmedName) {
      setErrorMessage('Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await adminUpdateMe({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (response && response.success && response.admin) {
        const admin = response.admin;
        const dynamicInitials = admin.initials || (admin.name ? admin.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AD');
        const updated = {
          fullName: admin.name || fallbackData.fullName,
          email: admin.email || fallbackData.email,
          role: admin.role || fallbackData.role,
          accountType: fallbackData.accountType,
          initials: dynamicInitials,
        };
        setLoadedData(updated);
        setFormData(updated);
        updateAdmin(admin); // Immediately updates Header across layout without page reload
        setSuccessMessage('Profile updated successfully');

        setTimeout(() => {
          setSuccessMessage('');
        }, 3500);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...loadedData });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // ── Password Modal Handlers ────────────────────────────────────────
  const handleOpenPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPasswords({ current: false, new: false, confirm: false });
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (isUpdatingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isUpdatingPassword) return;

    setPasswordError('');

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (!confirmPassword) {
      setPasswordError('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await adminChangePassword(currentPassword, newPassword);
      if (res && res.success) {
        setIsPasswordModalOpen(false);
        setSuccessMessage(res.message || 'Password updated successfully.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3500);
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconUserCircle size={28} style={{ color: 'var(--accent-color)' }} />
            Admin Profile
          </h1>
          <p className="page-desc">
            Manage your administrator profile information.
          </p>
        </div>
      </div>

      {/* ── Success Feedback Notification ─────────────────────── */}
      {successMessage && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          marginBottom: '24px',
          fontWeight: '600',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.15)'
        }}>
          <IconCheck size={18} />
          {successMessage}
        </div>
      )}

      {/* ── Error Feedback Notification ───────────────────────── */}
      {errorMessage && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          marginBottom: '24px',
          fontWeight: '600',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 16px rgba(239, 68, 68, 0.15)'
        }}>
          <span style={{ fontSize: '15px' }}>⚠</span>
          {errorMessage}
        </div>
      )}

      {/* ── Two-Column Layout ─────────────────────────────────── */}
      <div className="dashboard-grid-2">

        {/* ── Left Column: Admin Identity Summary Card ──────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconShield size={18} style={{ color: 'var(--accent-color)' }} />
              <span>Identity &amp; Role</span>
            </div>
            <span className="badge badge-active">
              <span className="badge-dot" />
              Active Session
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
            {/* Avatar Capsule */}
            <div style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '28px',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 0 24px var(--accent-glow)',
              marginBottom: '16px'
            }}>
              {formData.initials || 'AD'}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>
              {formData.fullName}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--accent-color-light)', fontWeight: '600', marginBottom: '16px' }}>
              {formData.role}
            </div>

            {/* Quick Meta List */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>{formData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid rgba(135,124,169,0.1)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Tier</span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>{formData.accountType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid rgba(135,124,169,0.1)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scope</span>
                <span style={{ color: 'var(--accent-color-light)', fontWeight: '600' }}>Platform Moderation &amp; Operations</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Edit Profile Form ──────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconUserCircle size={18} style={{ color: 'var(--accent-color)' }} />
              <span>Edit Profile</span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>

              {/* Editable: Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="admin-full-name">
                  Full Name
                </label>
                <input
                  id="admin-full-name"
                  type="text"
                  className="input-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Editable: Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="admin-profile-email">
                  Email Address
                </label>
                <input
                  id="admin-profile-email"
                  type="email"
                  className="input-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@voicefriends.io"
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Read-only: Role */}
              <div className="form-group">
                <label className="form-label" htmlFor="admin-role-view">
                  Assigned Role (Read-only)
                </label>
                <input
                  id="admin-role-view"
                  type="text"
                  className="input-control"
                  value={formData.role}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.04)' }}
                />
                <div className="form-hint">Roles are configured at the system level.</div>
              </div>

              {/* Read-only: Account Type */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" htmlFor="admin-account-type-view">
                  Account Type (Read-only)
                </label>
                <input
                  id="admin-account-type-view"
                  type="text"
                  className="input-control"
                  value={formData.accountType}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.04)' }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  <IconCheck size={16} />
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              {/* Subtle Password Change Link */}
              <div style={{
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(135, 124, 169, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Need to change your password?</span>
                <button
                  type="button"
                  onClick={handleOpenPasswordModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color-light)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent-color-light)')}
                >
                  Change Password →
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* ── Change Password Modal ─────────────────────────────── */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title="Change Password"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClosePasswordModal}
              disabled={isUpdatingPassword}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePasswordSubmit}
              disabled={isUpdatingPassword}
            >
              <IconCheck size={16} />
              {isUpdatingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        }
      >
        <form onSubmit={handlePasswordSubmit}>
          {passwordError && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              marginBottom: '18px',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>⚠</span>
              {passwordError}
            </div>
          )}

          {/* Current Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-current-password">
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-current-password"
                type={showPasswords.current ? 'text' : 'password'}
                className="input-control"
                style={{ paddingRight: '40px' }}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                disabled={isUpdatingPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? <IconEyeOff size={16} /> : <IconEyeOn size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-new-password">
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-new-password"
                type={showPasswords.new ? 'text' : 'password'}
                className="input-control"
                style={{ paddingRight: '40px' }}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min. 6 characters)"
                disabled={isUpdatingPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPasswords.new ? 'Hide password' : 'Show password'}
              >
                {showPasswords.new ? <IconEyeOff size={16} /> : <IconEyeOn size={16} />}
              </button>
            </div>
            <div className="form-hint">Must be at least 6 characters and different from current password.</div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-confirm-password">
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                className="input-control"
                style={{ paddingRight: '40px' }}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                disabled={isUpdatingPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPasswords.confirm ? 'Hide password' : 'Show password'}
              >
                {showPasswords.confirm ? <IconEyeOff size={16} /> : <IconEyeOn size={16} />}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
