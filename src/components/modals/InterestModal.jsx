import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function InterestModal({ interest, isOpen, onClose, onSave }) {
  const isEditing = Boolean(interest);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Entertainment & Arts');
  const [icon, setIcon] = useState('✨');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever modal opens or interest prop changes
  useEffect(() => {
    if (isOpen) {
      setName(interest ? interest.name || '' : '');
      setCategory(interest ? interest.category || 'Entertainment & Arts' : 'Entertainment & Arts');
      setIcon(interest ? interest.icon || '✨' : '✨');
      setIsActive(interest ? (interest.isActive !== undefined ? interest.isActive : true) : true);
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, interest]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    if (!name.trim()) {
      setError('Interest tag name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category && category.trim() ? category.trim() : 'Entertainment & Arts',
      icon: icon && icon.trim() ? icon.trim() : '✨',
      isActive: Boolean(isActive)
    };

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        const id = interest ? (interest.id || interest._id) : null;
        await onSave(payload, id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save interest tag.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Interest Tag: #${interest?.name || ''}` : "Add New Interest Tag"}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
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
            {isSaving ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Changes' : 'Create Interest Tag')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '16px', fontSize: '13px', fontWeight: '500' }}>
            <span>⚠ </span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Interest Tag Name</label>
          <input
            type="text"
            className="input-control"
            placeholder="e.g. Language Practice, Indie Pop, Chess"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            required
          />
          <span className="form-hint">Used by users during onboarding and discovery matching.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Category Group</label>
          <select
            className="select-control"
            style={{ width: '100%' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSaving}
          >
            <option value="Entertainment & Arts">Entertainment &amp; Arts</option>
            <option value="Gaming & Tech">Gaming &amp; Tech</option>
            <option value="Education & Skills">Education &amp; Skills</option>
            <option value="Literature & Culture">Literature &amp; Culture</option>
            <option value="Health & Lifestyle">Health &amp; Lifestyle</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Emoji Icon</label>
          <input
            type="text"
            className="input-control"
            style={{ width: '100px' }}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. 🎵"
          />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <input
            type="checkbox"
            id="activeToggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSaving}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="activeToggle" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--slate-800)', cursor: 'pointer' }}>
            Active for Discovery &amp; Profile Selection
          </label>
        </div>
      </form>
    </Modal>
  );
}

