import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const INTEREST_OPTIONS = [
  'Movies',
  'Gaming',
  'Music',
  'Books',
  'Fitness',
  'Language Practice',
  'General'
];

export default function IcebreakerModal({ promptData, isOpen, onClose, onSave }) {
  const isEditing = Boolean(promptData);
  const [interest, setInterest] = useState('Movies');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('active');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (promptData) {
        setInterest(promptData.interest || 'Movies');
        setPrompt(promptData.prompt || '');
        setStatus(promptData.status || 'active');
      } else {
        setInterest('Movies');
        setPrompt('');
        setStatus('active');
      }
      setError('');
      setIsSaving(false);
    }
  }, [promptData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;

    if (!prompt.trim()) {
      setError('Prompt text is required and cannot be empty.');
      return;
    }

    const payload = {
      interest: interest && interest.trim() ? interest.trim() : 'Movies',
      prompt: prompt.trim(),
      status: status === 'inactive' ? 'inactive' : 'active'
    };

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        const id = promptData ? (promptData.id || promptData._id) : null;
        await onSave(payload, id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save icebreaker prompt.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Icebreaker Prompt' : 'Add New Icebreaker Prompt'}
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
            {isSaving ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Changes' : 'Save Prompt')}
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
          <label className="form-label">Target Interest Category</label>
          <select
            className="select-control"
            style={{ width: '100%' }}
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            disabled={isSaving}
          >
            {INTEREST_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'General' ? 'General (Fallback for no mutual interests)' : opt}
              </option>
            ))}
          </select>
          <span className="form-hint">
            Select &quot;General&quot; to provide fallback conversation starters when peers share no mutual tags.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Icebreaker Prompt Text</label>
          <textarea
            className="input-control"
            rows={4}
            style={{ width: '100%', resize: 'vertical', minHeight: '90px' }}
            placeholder="Enter an icebreaker prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isSaving}
            required
          />
          <span className="form-hint">
            Displayed on the call connection overlay to encourage immediate, friendly engagement.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Prompt Status</label>
          <select
            className="select-control"
            style={{ width: '100%' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isSaving}
          >
            <option value="active">Active (Eligible for Call Starter Delivery)</option>
            <option value="inactive">Inactive (Archived / Disabled)</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

