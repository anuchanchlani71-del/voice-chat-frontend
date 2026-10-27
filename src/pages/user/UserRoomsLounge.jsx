import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import UserCreateRoomModal from '../../components/user/UserCreateRoomModal';
import { getRoomsApi } from '../../services/userRoomApi';
import {
  IconSearch,
  IconUsers,
  IconMic,
  IconGlobe,
  IconLock,
  IconClock,
  IconSparkles,
  IconPlus,
  IconX,
  IconChevronLeft,
  IconCheck,
  IconTag
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserRoomsLounge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState('all'); // 'all' | 'anyone' | 'invite_only'
  
  const [roomsList, setRoomsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlled Step 2 creation modal & reminder state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [remindedRoomIds, setRemindedRoomIds] = useState([]);

  // Fetch rooms from backend API
  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRoomsApi({
        search: searchQuery,
        accessType: accessFilter !== 'all' ? accessFilter : undefined,
        status: 'all'
      });
      if (res && res.success && Array.isArray(res.groupVoiceRooms)) {
        setRoomsList(res.groupVoiceRooms);
      } else {
        setRoomsList([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load voice rooms.');
      setRoomsList([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, accessFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Refresh rooms after new room creation
  const handleRoomCreated = (newRoom) => {
    fetchRooms();
  };

  // Filter rooms locally against search and accessType (as backup)
  const filteredRooms = useMemo(() => {
    return roomsList.filter(room => {
      // Access Type Filter
      if (accessFilter === 'anyone' && room.accessType !== 'anyone') return false;
      if (accessFilter === 'invite_only' && room.accessType !== 'invite_only') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (room.title || '').toLowerCase().includes(q);
        const topicMatch = (room.topic || '').toLowerCase().includes(q) || (room.tag || '').toLowerCase().includes(q);
        const hostNameMatch = (room.host?.fullName || room.host?.name || '').toLowerCase().includes(q);
        const hostUserMatch = (room.host?.username || '').toLowerCase().includes(q);
        return titleMatch || topicMatch || hostNameMatch || hostUserMatch;
      }

      return true;
    });
  }, [roomsList, accessFilter, searchQuery]);

  // Separate into Live Now and Scheduled
  const liveRooms = useMemo(() => {
    return filteredRooms.filter(r => r.status === 'active');
  }, [filteredRooms]);

  const scheduledRooms = useMemo(() => {
    return filteredRooms.filter(r => r.status === 'scheduled');
  }, [filteredRooms]);

  // Counts for filter tabs
  const counts = useMemo(() => {
    const total = roomsList.length;
    const anyoneCount = roomsList.filter(r => r.accessType === 'anyone').length;
    const inviteCount = roomsList.filter(r => r.accessType === 'invite_only').length;
    return {
      all: total,
      anyone: anyoneCount,
      invite_only: inviteCount
    };
  }, [roomsList]);

  const handleToggleReminder = (e, roomId) => {
    e.stopPropagation();
    setRemindedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation Bar ───────────────────────────────────────── */}
        <div className="profile-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/discover" className="profile-back-link">
              <IconChevronLeft size={16} />
              <span>Back to Discover Lounge</span>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="profile-badge-public">
              🎙️ Group Voice Lounges
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block" style={{ marginBottom: 24 }}>
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconMic size={14} />
              <span>Community Audio Spaces</span>
            </div>
            <h1 className="requests-header-title">Group Voice</h1>
            <p className="requests-header-sub">
              Find a room, join the conversation. Drop into live public audio lounges or scheduled intimate community spaces.
            </p>
          </div>

          {/* Action Button: Create Room (Controlled Step 2 notice) */}
          <div style={{ alignSelf: 'center' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-user-primary"
              style={{ padding: '10px 22px', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              title="Create a new Group Voice Room"
            >
              <IconPlus size={16} />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────────────────── */}
        <div className="requests-filter-bar" style={{ marginBottom: 32 }}>
          {/* Live Search Input */}
          <div className="requests-search-box">
            <IconSearch size={16} className="requests-search-icon" />
            <input
              type="text"
              placeholder="Search rooms, topics, or hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="requests-search-input"
              aria-label="Search rooms"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="requests-search-clear"
                title="Clear search"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills (STRICT Admin Alignment: All, Open Stages, Invite Only) */}
          <div className="requests-tabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`requests-tab ${accessFilter === 'all' ? 'active' : ''}`}
              onClick={() => setAccessFilter('all')}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              className={`requests-tab ${accessFilter === 'anyone' ? 'active' : ''}`}
              onClick={() => setAccessFilter('anyone')}
            >
              Open Stages ({counts.anyone})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '48px 0',
            color: 'var(--user-text-secondary)',
            fontSize: '0.92rem',
            gap: 10
          }}>
            <span className="room-status-pulse" style={{ background: 'var(--user-primary)' }} />
            <span>Loading live audio spaces from backend...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            color: '#ef4444',
            fontSize: '0.88rem',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between'
          }}>
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={fetchRooms}
              className="btn-user-secondary"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Section 1: Live Now ──────────────────────────────────────── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--user-status-online)',
                boxShadow: '0 0 10px rgba(0, 245, 212, 0.7)'
              }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--user-text)' }}>
                Live Now
              </h2>
              <span className="discover-badge-count">
                {liveRooms.length} active
              </span>
            </div>
          </div>

          {liveRooms.length > 0 ? (
            <div className="rooms-lounge-grid">
              {liveRooms.map(room => (
                <div key={room.id} className="room-lounge-card">
                  {/* Top Badges */}
                  <div className="room-card-top-bar">
                    <span className="room-status-badge live">
                      <span className="room-status-pulse" />
                      Live Stage
                    </span>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {/* Access Type Pill */}
                      {room.accessType === 'invite_only' ? (
                        <span className="room-access-pill invite" title="Selected People / Invite Only">
                          <IconLock size={12} />
                          <span>Invite Only</span>
                        </span>
                      ) : (
                        <span className="room-access-pill anyone" title="Open to Anyone">
                          <IconGlobe size={12} />
                          <span>Open Stage</span>
                        </span>
                      )}

                      {/* Participant / Capacity Ratio */}
                      <span className="room-capacity-pill">
                        <IconUsers size={12} />
                        <span>{room.participantCount} / {room.capacity}</span>
                      </span>
                    </div>
                  </div>

                  {/* Room Title & Description */}
                  <h3 className="room-card-title">{room.title}</h3>
                  <p className="room-card-desc">{room.description}</p>

                  {/* Topic Pill */}
                  <div style={{ marginBottom: 14 }}>
                    <span className="room-topic-chip">
                      <IconTag size={11} style={{ marginRight: 4 }} />
                      {room.topic || room.tag}
                    </span>
                  </div>

                  {/* Host Info */}
                  <div className="room-host-row">
                    <Link
                      to={`/user/${room.host?.id || ''}`}
                      className="room-host-link"
                      onClick={(e) => {
                        if (!room.host?.id) e.preventDefault();
                      }}
                    >
                      <div className="room-host-avatar" style={{ background: room.host?.avatarBg || 'var(--user-brand-gradient)', overflow: 'hidden' }}>
                        {renderAvatar(room.host?.avatar, room.host?.fullName || room.host?.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="room-host-name">Host: {room.host?.fullName || room.host?.name}</div>
                        <div className="room-host-handle">@{room.host?.username || 'host'}</div>
                      </div>
                    </Link>
                  </div>

                  {/* Speakers Row */}
                  {room.speakers && room.speakers.length > 0 && (
                    <div className="room-speakers-strip">
                      <span className="room-speakers-label">Speakers:</span>
                      <div className="room-speakers-pills">
                        {room.speakers.map((sp, idx) => (
                          <div key={idx} className={`room-speaker-mini-pill ${sp.isSpeaking ? 'speaking' : ''}`}>
                            <span className="room-speaker-mini-avatar" style={{ overflow: 'hidden' }}>{renderAvatar(sp.avatar, sp.name)}</span>
                            <span className="room-speaker-mini-name">{sp.name}</span>
                            {sp.isSpeaking && (
                              <span className="voice-wave-visualizer" style={{ transform: 'scale(0.65)', marginLeft: 2 }}>
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Action */}
                  <div className="room-card-footer">
                    <Link
                      to={`/room/${room.id}`}
                      className="btn-user-primary room-join-btn"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span>Join Stage</span>
                      <span style={{ fontSize: '1rem', marginLeft: 4 }}>&rarr;</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="requests-empty-card" style={{ padding: '32px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
              <h3 className="requests-empty-title" style={{ fontSize: '1.05rem' }}>No active live stages match your filter</h3>
              <p className="requests-empty-sub" style={{ fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                Try adjusting your search terms or switch to &ldquo;All&rdquo; access types.
              </p>
            </div>
          )}
        </section>

        {/* ── Section 2: Scheduled Stages ─────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--user-accent-soft)',
                boxShadow: '0 0 10px rgba(216, 150, 255, 0.5)'
              }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--user-text)' }}>
                Scheduled Audio Lounges
              </h2>
              <span className="discover-badge-count">
                {scheduledRooms.length} upcoming
              </span>
            </div>
          </div>

          {scheduledRooms.length > 0 ? (
            <div className="rooms-lounge-grid">
              {scheduledRooms.map(room => {
                const hasReminder = remindedRoomIds.includes(room.id);

                return (
                  <div key={room.id} className="room-lounge-card scheduled">
                    {/* Top Badges */}
                    <div className="room-card-top-bar">
                      <span className="room-status-badge scheduled">
                        <IconClock size={12} />
                        <span>Starts {room.scheduledFor}</span>
                      </span>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {room.accessType === 'invite_only' ? (
                          <span className="room-access-pill invite">
                            <IconLock size={12} />
                            <span>Invite Only</span>
                          </span>
                        ) : (
                          <span className="room-access-pill anyone">
                            <IconGlobe size={12} />
                            <span>Open Stage</span>
                          </span>
                        )}

                        <span className="room-capacity-pill">
                          <IconUsers size={12} />
                          <span>Max {room.capacity} seats</span>
                        </span>
                      </div>
                    </div>

                    {/* Room Title & Description */}
                    <h3 className="room-card-title">{room.title}</h3>
                    <p className="room-card-desc">{room.description}</p>

                    {/* Topic Pill */}
                    <div style={{ marginBottom: 14 }}>
                      <span className="room-topic-chip">
                        <IconTag size={11} style={{ marginRight: 4 }} />
                        {room.topic || room.tag}
                      </span>
                    </div>

                    {/* Host Info */}
                    <div className="room-host-row">
                      <Link
                        to={`/user/${room.host?.id || ''}`}
                        className="room-host-link"
                        onClick={(e) => {
                          if (!room.host?.id) e.preventDefault();
                        }}
                      >
                        <div className="room-host-avatar" style={{ background: room.host?.avatarBg || 'var(--user-brand-gradient)', overflow: 'hidden' }}>
                          {renderAvatar(room.host?.avatar, room.host?.fullName || room.host?.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="room-host-name">Host: {room.host?.fullName || room.host?.name}</div>
                          <div className="room-host-handle">@{room.host?.username || 'host'}</div>
                        </div>
                      </Link>
                    </div>

                    {/* Scheduled Info Strip */}
                    <div className="room-scheduled-timing-strip">
                      <IconClock size={14} style={{ color: 'var(--user-accent-soft)' }} />
                      <span>Scheduled for {room.scheduledFor} &bull; Calendar Notification</span>
                    </div>

                    {/* Card Action */}
                    <div className="room-card-footer">
                      <button
                        type="button"
                        onClick={(e) => handleToggleReminder(e, room.id)}
                        className={`btn-user-secondary room-join-btn ${hasReminder ? 'reminded' : ''}`}
                        style={{
                          background: hasReminder ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: hasReminder ? 'var(--user-status-online)' : 'var(--user-border-subtle)',
                          color: hasReminder ? 'var(--user-status-online)' : 'var(--user-text-secondary)'
                        }}
                      >
                        {hasReminder ? (
                          <>
                            <IconCheck size={14} />
                            <span>Reminder Set</span>
                          </>
                        ) : (
                          <>
                            <span>🔔 Set Reminder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="requests-empty-card" style={{ padding: '32px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗓️</div>
              <h3 className="requests-empty-title" style={{ fontSize: '1.05rem' }}>No scheduled stages found</h3>
              <p className="requests-empty-sub" style={{ fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                There are no upcoming scheduled spaces under this filter.
              </p>
            </div>
          )}
        </section>

        {/* ── Overall Empty State (If neither live nor scheduled match) ── */}
        {liveRooms.length === 0 && scheduledRooms.length === 0 && (
          <div className="requests-empty-card" style={{ padding: '48px 24px', marginTop: 10 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h3 className="requests-empty-title">No matching rooms found</h3>
            <p className="requests-empty-sub">
              No audio rooms matched &ldquo;{searchQuery}&rdquo;. Try clearing your search query or reset your access filter.
            </p>
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAccessFilter('all');
                }}
                className="btn-user-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Create Room Modal (Step 2 Implementation) ── */}
        <UserCreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onRoomCreated={handleRoomCreated}
        />



      </div>
    </UserLayout>
  );
}
