import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { adminGetVoiceCallById } from '../../services/adminApi';
import { IconPhoneCall, IconMic, IconClock, IconWaveform } from '../common/Icons';

export default function CallDetailModal({ call, isOpen, onClose }) {
  const [detailCall, setDetailCall] = useState(call);

  useEffect(() => {
    if (call && isOpen) {
      setDetailCall(call);
      const callId = call.id || call._id;
      if (callId) {
        adminGetVoiceCallById(callId)
          .then((res) => {
            if (res && res.voiceCall) {
              setDetailCall(res.voiceCall);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch voice call detail:', err);
          });
      }
    }
  }, [call, isOpen]);

  if (!call && !detailCall) return null;

  const currentCall = detailCall || call;
  const caller = currentCall.caller || {};
  const receiver = currentCall.receiver || {};

  const formatCallDate = (val) => {
    if (!val) return 'Recently';
    if (
      typeof val === 'string' &&
      (val.includes('ago') || val.includes('Today') || val.includes('Yesterday'))
    ) {
      return val;
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="1-to-1 Voice Chat Session Details"
      size="md"
      footer={
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
          Close
        </button>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', background: 'var(--slate-100)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
            {currentCall.id}
          </span>
          <StatusBadge status={currentCall.status} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
          {formatCallDate(currentCall.startedAt || currentCall.createdAt)}
        </span>
      </div>

      {/* Participants Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--slate-200)' }}>
        {/* Caller */}
        <div style={{ textAlign: 'center' }}>
          <img
            src={caller.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt=""
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px' }}
          />
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
            {caller.fullName || 'Caller'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            @{caller.username || 'caller'} (Caller)
          </div>
        </div>

        {/* Audio Wave Icon / Connect line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPhoneCall size={16} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--primary-400)', fontWeight: '700', textTransform: 'uppercase' }}>
            1-to-1 P2P
          </span>
        </div>

        {/* Receiver */}
        <div style={{ textAlign: 'center' }}>
          <img
            src={receiver.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
            alt=""
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px' }}
          />
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>
            {receiver.fullName || 'Receiver'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
            @{receiver.username || 'receiver'} (Receiver)
          </div>
        </div>
      </div>

      {/* Session Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600' }}>Call Duration</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--slate-900)', marginTop: '2px' }}>
            {currentCall.durationFormatted || '0m 00s'}
          </div>
        </div>

        <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '600' }}>Audio Quality Metrics</span>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary-700)', marginTop: '4px' }}>
            {currentCall.audioQuality || 'Standard Voice (Opus)'}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Termination / Hangup Reason</label>
        <div style={{ fontSize: '13px', color: 'var(--slate-700)', background: 'var(--slate-50)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
          {currentCall.endReason || 'Normal Call Hangup'}
        </div>
      </div>
    </Modal>
  );
}

