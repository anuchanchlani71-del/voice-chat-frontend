import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { IconPlus, IconTrash } from '../common/Icons';

export default function PlanModal({ planData, isOpen, onClose, onSave }) {
  const isEditing = Boolean(planData);

  // Form State
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Features list
  const [features, setFeatures] = useState([]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Pricing
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [monthlyCurrency, setMonthlyCurrency] = useState('INR');
  const [yearlyAmount, setYearlyAmount] = useState(0);
  const [yearlyCurrency, setYearlyCurrency] = useState('INR');

  // Limits
  const [maxDailyCallMinutes, setMaxDailyCallMinutes] = useState(0);
  const [maxGroupRoomCapacity, setMaxGroupRoomCapacity] = useState(10);
  const [audioBitrateKbps, setAudioBitrateKbps] = useState(64);
  const [canHostGroupRooms, setCanHostGroupRooms] = useState(true);
  const [canCreatePrivateRooms, setCanCreatePrivateRooms] = useState(false);
  const [hasAuraGlow, setHasAuraGlow] = useState(false);
  const [hasPriorityMatching, setHasPriorityMatching] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (planData) {
        setKey(planData.key || '');
        setName(planData.name || '');
        setDescription(planData.description || '');
        setBadgeText(planData.badgeText || '');
        setDisplayOrder(planData.displayOrder !== undefined ? planData.displayOrder : 1);
        setIsActive(planData.isActive !== undefined ? Boolean(planData.isActive) : true);
        setIsDefault(planData.isDefault !== undefined ? Boolean(planData.isDefault) : false);

        setFeatures(Array.isArray(planData.features) ? [...planData.features] : []);
        setNewFeatureText('');

        setMonthlyAmount(planData.pricing?.monthly?.amount ?? 0);
        setMonthlyCurrency(planData.pricing?.monthly?.currency || 'INR');
        setYearlyAmount(planData.pricing?.yearly?.amount ?? 0);
        setYearlyCurrency(planData.pricing?.yearly?.currency || 'INR');

        setMaxDailyCallMinutes(planData.limits?.maxDailyCallMinutes ?? 0);
        setMaxGroupRoomCapacity(planData.limits?.maxGroupRoomCapacity ?? 10);
        setAudioBitrateKbps(planData.limits?.audioBitrateKbps ?? 64);
        setCanHostGroupRooms(planData.limits?.canHostGroupRooms ?? true);
        setCanCreatePrivateRooms(planData.limits?.canCreatePrivateRooms ?? false);
        setHasAuraGlow(planData.limits?.hasAuraGlow ?? false);
        setHasPriorityMatching(planData.limits?.hasPriorityMatching ?? false);
      } else {
        // Reset defaults for Create
        setKey('');
        setName('');
        setDescription('');
        setBadgeText('');
        setDisplayOrder(1);
        setIsActive(true);
        setIsDefault(false);
        setFeatures([
          'Standard audio quality',
          'Community group voice rooms'
        ]);
        setNewFeatureText('');

        setMonthlyAmount(0);
        setMonthlyCurrency('INR');
        setYearlyAmount(0);
        setYearlyCurrency('INR');

        setMaxDailyCallMinutes(0);
        setMaxGroupRoomCapacity(10);
        setAudioBitrateKbps(64);
        setCanHostGroupRooms(true);
        setCanCreatePrivateRooms(false);
        setHasAuraGlow(false);
        setHasPriorityMatching(false);
      }
      setError('');
      setIsSaving(false);
    }
  }, [planData, isOpen]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    setFeatures((prev) => [...prev, trimmed]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    // Frontend validation
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) {
      setError('Plan key is required.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(normalizedKey)) {
      setError('Plan key must only contain lowercase alphanumeric characters, dashes, or underscores.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Plan name is required.');
      return;
    }

    if (isNaN(Number(monthlyAmount)) || Number(monthlyAmount) < 0) {
      setError('Monthly price amount cannot be negative.');
      return;
    }
    if (isNaN(Number(yearlyAmount)) || Number(yearlyAmount) < 0) {
      setError('Yearly price amount cannot be negative.');
      return;
    }
    if (isNaN(Number(maxDailyCallMinutes)) || Number(maxDailyCallMinutes) < 0) {
      setError('Max daily call minutes cannot be negative.');
      return;
    }
    if (isNaN(Number(maxGroupRoomCapacity)) || Number(maxGroupRoomCapacity) < 0) {
      setError('Max group room capacity cannot be negative.');
      return;
    }
    if (isNaN(Number(audioBitrateKbps)) || Number(audioBitrateKbps) < 0) {
      setError('Audio bitrate cannot be negative.');
      return;
    }
    if (isNaN(Number(displayOrder)) || Number(displayOrder) < 0) {
      setError('Display order must be a non-negative number.');
      return;
    }

    const payload = {
      key: normalizedKey,
      name: trimmedName,
      description: description.trim(),
      badgeText: badgeText.trim(),
      displayOrder: Number(displayOrder),
      isActive: Boolean(isActive),
      isDefault: Boolean(isDefault),
      features: features.map((f) => f.trim()).filter(Boolean),
      pricing: {
        monthly: {
          amount: Number(monthlyAmount),
          currency: monthlyCurrency.trim().toUpperCase() || 'INR'
        },
        yearly: {
          amount: Number(yearlyAmount),
          currency: yearlyCurrency.trim().toUpperCase() || 'INR'
        }
      },
      limits: {
        maxDailyCallMinutes: Number(maxDailyCallMinutes),
        maxGroupRoomCapacity: Number(maxGroupRoomCapacity),
        audioBitrateKbps: Number(audioBitrateKbps),
        canHostGroupRooms: Boolean(canHostGroupRooms),
        canCreatePrivateRooms: Boolean(canCreatePrivateRooms),
        hasAuraGlow: Boolean(hasAuraGlow),
        hasPriorityMatching: Boolean(hasPriorityMatching)
      }
    };

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        const id = planData ? (planData.id || planData._id) : null;
        await onSave(payload, id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save subscription plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Plan: ${planData.name}` : 'Create Subscription Plan'}
      size="lg"
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
            disabled={isSaving}
          >
            {isSaving ? (isEditing ? 'Saving Changes…' : 'Creating Plan…') : (isEditing ? 'Save Changes' : 'Create Plan')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
        {error && (
          <div style={{
            padding: '12px 14px',
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

        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Basic Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Key <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-control"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase())}
                placeholder="e.g. aura, pro_plus"
                disabled={isEditing && planData?.key === 'free'}
                style={{ width: '100%' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Lowercase letters, numbers, dashes, underscores</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Name <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aura Membership"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Badge Text
              </label>
              <input
                type="text"
                className="input-control"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Aura, VIP, Popular"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Display Order
              </label>
              <input
                type="number"
                min="0"
                className="input-control"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              className="input-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of this tier's privileges..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 2: Pricing */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Pricing
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Monthly Pricing</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-control"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="0"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="input-control"
                  value={monthlyCurrency}
                  onChange={(e) => setMonthlyCurrency(e.target.value.toUpperCase())}
                  style={{ width: '70px', textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Yearly Pricing</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-control"
                  value={yearlyAmount}
                  onChange={(e) => setYearlyAmount(e.target.value)}
                  placeholder="0"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="input-control"
                  value={yearlyCurrency}
                  onChange={(e) => setYearlyCurrency(e.target.value.toUpperCase())}
                  style={{ width: '70px', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Room & Voice Limits */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Limits &amp; Technical Capabilities
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Max Call Mins / Day (0 = unltd)
              </label>
              <input
                type="number"
                min="0"
                className="input-control"
                value={maxDailyCallMinutes}
                onChange={(e) => setMaxDailyCallMinutes(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Max Room Capacity
              </label>
              <input
                type="number"
                min="2"
                className="input-control"
                value={maxGroupRoomCapacity}
                onChange={(e) => setMaxGroupRoomCapacity(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Audio Bitrate (kbps)
              </label>
              <input
                type="number"
                min="16"
                className="input-control"
                value={audioBitrateKbps}
                onChange={(e) => setAudioBitrateKbps(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={canHostGroupRooms}
                onChange={(e) => setCanHostGroupRooms(e.target.checked)}
              />
              Can host community voice rooms
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={canCreatePrivateRooms}
                onChange={(e) => setCanCreatePrivateRooms(e.target.checked)}
              />
              Can create invite-only rooms
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={hasAuraGlow}
                onChange={(e) => setHasAuraGlow(e.target.checked)}
              />
              Exclusive Aura avatar glow
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={hasPriorityMatching}
                onChange={(e) => setHasPriorityMatching(e.target.checked)}
              />
              Priority matchmaking queue
            </label>
          </div>
        </div>

        {/* Section 4: Features List */}
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Highlight Features
          </h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              className="input-control"
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
              placeholder="Add feature item (e.g. 128 kbps HD Voice)..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddFeature}
            >
              <IconPlus size={16} />
              Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {features.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}
              >
                <span>✓ {feat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="btn-icon-only"
                  style={{ color: 'var(--danger-500)', padding: '2px' }}
                  title="Remove feature"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
            {features.length === 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No features added yet.
              </span>
            )}
          </div>
        </div>

        {/* Section 5: Plan Settings */}
        <div style={{ marginBottom: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Plan Settings
          </h4>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <strong>Active status</strong> (available for tier assignments)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <strong>Default Plan</strong> (automatically assigned to registered users)
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
