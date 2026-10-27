import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { adminGetUsers, adminGetPlans } from '../../services/adminApi';

export default function SubscriptionModal({
  subscriptionData,
  isOpen,
  onClose,
  onSave
}) {
  const isEditing = Boolean(subscriptionData);

  const [usersList, setUsersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form fields
  const [userId, setUserId] = useState('');
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Format date helper for input type="date"
  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Load available users and plans when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsSaving(false);
      setLoadingOptions(true);

      Promise.all([
        adminGetUsers({ limit: 100 }),
        adminGetPlans({ limit: 100 })
      ])
        .then(([usersRes, plansRes]) => {
          if (usersRes && Array.isArray(usersRes.users)) {
            setUsersList(usersRes.users);
          }
          if (plansRes && Array.isArray(plansRes.plans)) {
            setPlansList(plansRes.plans);
          }
        })
        .catch((err) => {
          console.error('Failed to load user or plan options:', err);
        })
        .finally(() => {
          setLoadingOptions(false);
        });

      if (subscriptionData) {
        // Edit mode: populate existing values
        const u = subscriptionData.user;
        setUserId(u ? (u.id || u._id) : '');
        const p = subscriptionData.plan;
        setPlanId(p ? (p.id || p._id || p.key) : (subscriptionData.planKey || ''));
        setStatus(subscriptionData.status || 'active');
        setStartDate(formatDateForInput(subscriptionData.startDate) || formatDateForInput(new Date()));
        setEndDate(formatDateForInput(subscriptionData.endDate) || '');
        setAutoRenew(Boolean(subscriptionData.autoRenew));
      } else {
        // Create mode: reset to defaults
        setUserId('');
        setPlanId('');
        setStatus('active');
        setStartDate(formatDateForInput(new Date()));
        setEndDate('');
        setAutoRenew(false);
      }
    }
  }, [subscriptionData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    if (!isEditing && !userId) {
      setError('Please select a user for this subscription.');
      return;
    }

    if (!planId) {
      setError('Please select a plan for this subscription.');
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setError('End date cannot be earlier than start date.');
        return;
      }
    }

    const payload = {
      planId: planId.trim(),
      status: status.trim().toLowerCase(),
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      autoRenew: Boolean(autoRenew)
    };

    if (!isEditing) {
      payload.userId = userId.trim();
    }

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        const id = subscriptionData ? (subscriptionData.id || subscriptionData._id) : null;
        await onSave(payload, id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save subscription.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subscription Assignment' : 'Create User Subscription'}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={isSaving || loadingOptions}
          >
            {isSaving ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Changes' : 'Create Subscription')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ padding: '4px 0' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            ⚠ {error}
          </div>
        )}

        {/* User Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
            User Account <span style={{ color: 'var(--danger-500)' }}>*</span>
          </label>
          {isEditing ? (
            <div style={{
              padding: '10px 12px',
              background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontWeight: '700' }}>
                {subscriptionData?.user?.fullName || subscriptionData?.user?.username || 'User'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                (@{subscriptionData?.user?.username}) · {subscriptionData?.user?.email || 'No email'}
              </span>
            </div>
          ) : (
            <select
              className="select-control"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: '100%' }}
              required
              disabled={loadingOptions}
            >
              <option value="">-- Select User --</option>
              {usersList.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.fullName} (@{u.username}) {u.email ? `— ${u.email}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Plan Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Subscription Plan <span style={{ color: 'var(--danger-500)' }}>*</span>
          </label>
          <select
            className="select-control"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            style={{ width: '100%' }}
            required
            disabled={loadingOptions}
          >
            <option value="">-- Select Plan --</option>
            {plansList.map((p) => {
              const mPrice = p.pricing?.monthly?.amount ?? 0;
              const priceText = mPrice === 0 ? 'Free' : `₹${mPrice}/mo`;
              return (
                <option key={p.id || p._id || p.key} value={p.id || p._id || p.key}>
                  {p.name} ({p.key}) — {priceText} {p.isDefault ? '[Default]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Status
          </label>
          <select
            className="select-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Start & End Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Start Date
            </label>
            <input
              type="date"
              className="input-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
              End Date (optional)
            </label>
            <input
              type="date"
              className="input-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Perpetual / None"
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Leave empty for ongoing/perpetual</span>
          </div>
        </div>

        {/* Auto Renew checkbox */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
            />
            Auto-renew enabled
          </label>
        </div>
      </form>
    </Modal>
  );
}
