import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { IconGlobe, IconLock, IconUsers, IconMic, IconTag, IconClock } from '../common/Icons';
import { adminGetGroupVoiceRoomById } from '../../services/adminApi';

export default function GroupVoiceRoomDetailModal({ room, isOpen, onClose }) {
  const [detailRoom, setDetailRoom] = useState(room);

  useEffect(() => {
    if (room && isOpen) {
      setDetailRoom(room);
      const roomId = room.id || room._id;
      if (roomId) {
        adminGetGroupVoiceRoomById(roomId)
          .then((res) => {
            if (res && res.groupVoiceRoom) {
              setDetailRoom(res.groupVoiceRoom);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch fresh group voice room detail:', err);
          });
      }
    }
  }, [room, isOpen]);

  if (!isOpen || (!room && !detailRoom)) return null;

  const currentRoom = detailRoom || room;
  const host = currentRoom.host || {};
  const isInviteOnly = (currentRoom.accessType || '').toLowerCase().includes('invite') || (currentRoom.accessType || '').toLowerCase().includes('select');
  const invitedUsers = currentRoom.invitedUsers || [];

  const formatTimestamp = (val) => {
    if (!val) return 'Just now';
    if (typeof val === 'string' && (val.includes('ago') || val.includes('Today') || val.includes('Yesterday'))) {
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
      title="Group Voice Room Details"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Room ID: <span style={{ fontFamily: 'monospace', color: '#c4b5fd' }}>{currentRoom.id}</span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {/* Header Info */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(167, 139, 250, 0.15)',
              color: '#c4b5fd',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconTag size={12} />
              {currentRoom.topic || 'General Discussion'}
            </span>
            <StatusBadge status={currentRoom.status || 'active'} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 6px 0' }}>
            {currentRoom.title || currentRoom.name}
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconClock size={13} />
            Created {formatTimestamp(currentRoom.createdAt)}
          </div>
        </div>
      </div>

      {/* Host & Room Capacity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Host Info Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <img
            src={host.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt=""
            style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167, 139, 250, 0.4)' }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-color-light, #c4b5fd)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              Host / Room Creator
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {host.fullName || 'Host User'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              @{host.username || 'host'}
            </div>
          </div>
        </div>

        {/* Capacity & Live Voice Stats */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max Capacity:</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{currentRoom.capacity || currentRoom.maxParticipants || 20} seats</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Participants Live:</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: currentRoom.status === 'active' ? '#34d399' : 'var(--text-muted)',
              background: currentRoom.status === 'active' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconMic size={12} />
              {currentRoom.participantCount || 0} active
            </span>
          </div>
        </div>
      </div>

      {/* Description / Agenda */}
      {currentRoom.description && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
            Room Description &amp; Topic Agenda
          </div>
          <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
            {currentRoom.description}
          </p>
        </div>
      )}

      {/* Access Type Breakdown (Display-Only) */}
      <div style={{
        background: 'rgba(20, 16, 36, 0.85)',
        border: '1px solid rgba(135, 124, 169, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Access Control (Host Configured)</span>
          </div>
          {isInviteOnly ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              <IconLock size={14} />
              Selected People / Invite Only ({invitedUsers.length})
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              <IconGlobe size={14} />
              Anyone (Public to Friends &amp; Strangers)
            </span>
          )}
        </div>

        {/* Dynamic Display of Host-Invited Users (Read-Only) */}
        {isInviteOnly ? (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Invited users selected by the host ({invitedUsers.length} user{invitedUsers.length === 1 ? '' : 's'}):
            </div>
            {invitedUsers.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                No specific users invited yet by host.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {invitedUsers.map((user, idx) => (
                  <div
                    key={user.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.fullName || user.username || 'User'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        @{user.username || 'user'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            This room is open to anyone. Friends and strangers can discover and join this room directly from the user lobby.
          </div>
        )}
      </div>
    </Modal>
  );
}
