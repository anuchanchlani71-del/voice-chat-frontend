/**
 * Group WebRTC Media Foundation & Multi-User Negotiation Manager
 * Phase 3B — Voice Chat & Friends
 *
 * Manages:
 * - Local microphone MediaStream lifecycle & permissions
 * - Microphone track mute/unmute state (track.enabled)
 * - RTCPeerConnection creation, configuration, and event listeners
 * - Multi-user Offer / Answer / ICE candidate negotiation
 * - Deterministic offer ownership (Publisher <-> Publisher)
 * - Controlled Publisher -> Subscriber negotiation (Host/Speaker -> Listener)
 * - Remote MediaStream tracking per participant
 * - Phase 2 targeted signaling integration (room:webrtc_offer, room:webrtc_answer, room:webrtc_ice_candidate)
 * - Clean peer cleanup and room isolation
 */

const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class GroupWebRTCManager {
  /**
   * @param {object} options
   * @param {string} options.roomId - The ID of the active room
   * @param {object} [options.socket] - Connected Socket.IO client instance
   * @param {object} [options.currentUser] - Authenticated user object
   * @param {string} [options.currentUserId] - User ID string override
   * @param {boolean} [options.isPublisher=false] - Whether current user can publish audio
   * @param {object} [options.rtcConfig] - Custom WebRTC ICE servers configuration
   * @param {object} [options.navigator] - Injected navigator for testing
   * @param {Function} [options.onRemoteStream] - Callback (remoteUserId, stream)
   * @param {Function} [options.onRemoteStreamRemoved] - Callback (remoteUserId)
   * @param {Function} [options.onPeerStateChange] - Callback (remoteUserId, state)
   * @param {Function} [options.onSignalingOffer] - Callback (data) for incoming offer
   * @param {Function} [options.onSignalingAnswer] - Callback (data) for incoming answer
   * @param {Function} [options.onSignalingIceCandidate] - Callback (data) for incoming ICE
   * @param {Function} [options.onError] - Callback (errorObject)
   */
  constructor(options = {}) {
    if (!options.roomId) {
      throw new Error('GroupWebRTCManager requires a roomId');
    }

    this.roomId = options.roomId;
    this.socket = options.socket || null;
    this.currentUser = options.currentUser || null;
    this.currentUserId = this.currentUser
      ? (this.currentUser.id || (this.currentUser._id ? this.currentUser._id.toString() : '') || this.currentUser.username || '')
      : (options.currentUserId || '');
    this.isHost = !!options.isHost;
    this.isSpeaker = !!options.isSpeaker;
    this.isPublisher = !!(options.isPublisher || this.isHost || this.isSpeaker);
    this.rtcConfig = options.rtcConfig || DEFAULT_RTC_CONFIG;
    this.navigator = options.navigator || (typeof navigator !== 'undefined' ? navigator : null);

    // Callbacks
    this.onRemoteStream = options.onRemoteStream || null;
    this.onRemoteStreamRemoved = options.onRemoteStreamRemoved || null;
    this.onPeerStateChange = options.onPeerStateChange || null;
    this.onSignalingOffer = options.onSignalingOffer || null;
    this.onSignalingAnswer = options.onSignalingAnswer || null;
    this.onSignalingIceCandidate = options.onSignalingIceCandidate || null;
    this.onError = options.onError || null;

    // Web Audio API Speaking Detection (Phase 3C-3 & 3E)
    this.onLocalSpeakingChange = options.onLocalSpeakingChange || null;
    this.onRemoteSpeakingChange = options.onRemoteSpeakingChange || null;
    this.speakingThreshold = options.speakingThreshold !== undefined ? options.speakingThreshold : 0.04;
    this.speakingDebounceMs = options.speakingDebounceMs !== undefined ? options.speakingDebounceMs : 250;
    this.isSpeaking = false;
    this.remoteSpeakingUsers = new Set();
    this._speakingDetectionActive = false;
    this._speakingRafId = null;
    this._speakingTimeoutId = null;
    this._lastSpokenTime = 0;
    this.audioContext = null;
    this.localAudioSourceNode = null;
    this.localAnalyserNode = null;
    this._audioContextClass = options.audioContextClass || (typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null);
    this.isDestroyed = false;

    // Local Media State & Race Protection
    this.localStream = null;
    this.isMuted = false;
    this.microphonePermissionDenied = false;
    this.localAudioStartPromise = null;
    this._demotionGeneration = 0;

    // Role Transition & Renegotiation Tracking (Phase 3C-1 & Phase 3C-2)
    this.needsRenegotiation = new Set();
    this.negotiationInProgress = new Map();
    this.pendingNegotiation = new Map();
    this.latestParticipants = [];

    // Peers & Streams Storage (keyed by remoteUserId)
    this.peers = new Map();
    this.remoteStreams = new Map();
    this.iceCandidateQueues = new Map();
    this.makingOffer = new Map();

    // Bound Socket Event Handlers
    this._boundSocketOffer = this._handleSocketOffer.bind(this);
    this._boundSocketAnswer = this._handleSocketAnswer.bind(this);
    this._boundSocketIceCandidate = this._handleSocketIceCandidate.bind(this);
    this._boundSocketSpeakingStarted = this._handleSocketSpeakingStarted.bind(this);
    this._boundSocketSpeakingStopped = this._handleSocketSpeakingStopped.bind(this);

    this._registerSocketListeners();
  }

  // ── 1. SOCKET LISTENER REGISTRATION & ROOM ISOLATION ────────────────

  _registerSocketListeners() {
    if (!this.socket) return;
    this.socket.on('room:webrtc_offer', this._boundSocketOffer);
    this.socket.on('room:webrtc_answer', this._boundSocketAnswer);
    this.socket.on('room:webrtc_ice_candidate', this._boundSocketIceCandidate);
    this.socket.on('room:speaking_started', this._boundSocketSpeakingStarted);
    this.socket.on('room:speaking_stopped', this._boundSocketSpeakingStopped);
  }

  _unregisterSocketListeners() {
    if (!this.socket) return;
    this.socket.off('room:webrtc_offer', this._boundSocketOffer);
    this.socket.off('room:webrtc_answer', this._boundSocketAnswer);
    this.socket.off('room:webrtc_ice_candidate', this._boundSocketIceCandidate);
    this.socket.off('room:speaking_started', this._boundSocketSpeakingStarted);
    this.socket.off('room:speaking_stopped', this._boundSocketSpeakingStopped);
  }

  async _handleSocketOffer(data) {
    if (!data || data.roomId !== this.roomId) return;

    if (this.onSignalingOffer) {
      this.onSignalingOffer(data);
    }

    const fromUserId = data.fromUserId;
    const offer = data.offer || data.sdp;
    if (!fromUserId || !offer) return;

    try {
      await this.handleOffer(fromUserId, offer);
    } catch (err) {
      this._notifyError({
        code: 'negotiation_offer_error',
        name: 'OfferError',
        message: err.message || 'Failed to handle remote offer'
      });
    }
  }

  async _handleSocketAnswer(data) {
    if (!data || data.roomId !== this.roomId) return;

    if (this.onSignalingAnswer) {
      this.onSignalingAnswer(data);
    }

    const fromUserId = data.fromUserId;
    const answer = data.answer || data.sdp;
    if (!fromUserId || !answer) return;

    try {
      await this.handleAnswer(fromUserId, answer);
    } catch (err) {
      this._notifyError({
        code: 'negotiation_answer_error',
        name: 'AnswerError',
        message: err.message || 'Failed to handle remote answer'
      });
    }
  }

  async _handleSocketIceCandidate(data) {
    if (!data || data.roomId !== this.roomId) return;

    if (this.onSignalingIceCandidate) {
      this.onSignalingIceCandidate(data);
    }

    const fromUserId = data.fromUserId;
    const candidate = data.candidate;
    if (!fromUserId || !candidate) return;

    if (this.onSignalingIceCandidate) {
      this.onSignalingIceCandidate(data);
    }

    try {
      await this.handleIceCandidate(fromUserId, candidate);
    } catch (err) {
      // Non-fatal candidate error
    }
  }

  /**
   * Update or attach a Socket.IO client instance
   */
  setSocket(socket) {
    if (this.socket === socket) return;
    this._unregisterSocketListeners();
    this.socket = socket;
    this._registerSocketListeners();
  }

  /**
   * Update current user publishing role (Host or Speaker)
   * Phase 3C-1 Dynamic Role Transition Lifecycle
   * @param {object} role
   * @param {boolean} [role.isHost=false]
   * @param {boolean} [role.isSpeaker=false]
   */
  setRole({ isHost = false, isSpeaker = false } = {}) {
    const previousIsPublisher = this.isPublisher;
    const nextIsPublisher = !!(isHost || isSpeaker);

    this.isHost = !!isHost;
    this.isSpeaker = !!isSpeaker;
    this.isPublisher = nextIsPublisher;

    // Detect transition
    if (!previousIsPublisher && nextIsPublisher) {
      // PROMOTION: Listener -> Host/Speaker
      this._handlePromotionTransition();
    } else if (previousIsPublisher && !nextIsPublisher) {
      // DEMOTION: Host/Speaker -> Listener
      this._handleDemotionTransition();
    }
    // If no transition (true -> true or false -> false), skip expensive lifecycle work
  }

  /**
   * Handle transition from subscriber (Listener) to publisher (Host/Speaker)
   * @private
   */
  _handlePromotionTransition() {
    // If local stream already active, attach tracks to existing peers, mark for renegotiation, and renegotiate
    if (this.localStream) {
      this._initLocalSpeakingDetector();
      this.peers.forEach((pc, remoteUserId) => {
        this.addLocalTracks(pc);
        this.needsRenegotiation.add(remoteUserId);
        this.renegotiate(remoteUserId).catch(() => {});
      });
    } else {
      const acquirePromise = this.localAudioStartPromise || this.startLocalAudio();
      acquirePromise.then(() => {
        if (this.isPublisher && !this.localStream && !this.isDestroyed) {
          return this.startLocalAudio();
        }
      }).then(() => {
        if (this.isPublisher && this.localStream) {
          this._initLocalSpeakingDetector();
          this.peers.forEach((pc, remoteUserId) => {
            this.addLocalTracks(pc);
            this.needsRenegotiation.add(remoteUserId);
            this.renegotiate(remoteUserId).catch(() => {});
          });
        }
      }).catch(() => {
        // Error already handled and notified in startLocalAudio
      });
    }

    // Re-evaluate peers if latest participant roster is available
    if (this.latestParticipants && this.latestParticipants.length > 0) {
      this.syncParticipants(this.latestParticipants).catch(() => {});
    }
  }

  /**
   * Handle transition from publisher (Host/Speaker) to subscriber (Listener)
   * @private
   */
  _handleDemotionTransition() {
    // 0. Increment demotion generation so any pending in-flight getUserMedia is invalidated
    this._demotionGeneration++;

    // 1. Remove local sending tracks from all peer connections and renegotiate surviving publisher peers
    this.peers.forEach((pc, remoteUserId) => {
      this.removeLocalTracks(pc);
      this.needsRenegotiation.add(remoteUserId);
      this.renegotiate(remoteUserId).catch(() => {});
    });

    // 2. Stop local microphone hardware access and release tracks
    this.stopLocalAudio();

    // 3. Clean up listener-to-listener peer connections
    if (this.latestParticipants && this.latestParticipants.length > 0) {
      this.syncParticipants(this.latestParticipants).catch(() => {});
    }
  }

  // ── 2. LOCAL MICROPHONE ACCESS & CONTROLS ───────────────────────────

  /**
   * Request microphone access and store local MediaStream
   * Protected with localAudioStartPromise to prevent concurrent/duplicate acquisition
   * @param {object} [constraints={ audio: true, video: false }]
   * @returns {Promise<MediaStream>}
   */
  async startLocalAudio(constraints = { audio: true, video: false }) {
    if (this.localStream) {
      this._applyMuteToTracks();
      return this.localStream;
    }

    if (this.localAudioStartPromise) {
      return this.localAudioStartPromise;
    }

    const startGeneration = this._demotionGeneration;

    this.localAudioStartPromise = (async () => {
      try {
        const nav = this.navigator || (typeof navigator !== 'undefined' ? navigator : null);
        if (!nav || !nav.mediaDevices || typeof nav.mediaDevices.getUserMedia !== 'function') {
          const error = {
            code: 'unsupported',
            name: 'NotSupportedError',
            message: 'Microphone access is not supported by your browser environment.'
          };
          this._notifyError(error);
          throw error;
        }

        const stream = await nav.mediaDevices.getUserMedia(constraints);

        // RACE CHECK: What if user was demoted while getUserMedia was pending?
        if (this._demotionGeneration !== startGeneration) {
          // Stop acquired tracks immediately to prevent microphone/hardware leak
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach((track) => {
              if (typeof track.stop === 'function') track.stop();
            });
          }
          return null;
        }

        this.localStream = stream;
        this.microphonePermissionDenied = false;

        // Apply initial mute state (preserves mute state; never hot-mics user)
        this._applyMuteToTracks();

        // Initialize Web Audio API speaking detection (Phase 3C-3)
        this._initLocalSpeakingDetector();

        // Attach tracks to all existing peer connections if publisher
        if (this.isPublisher) {
          this.peers.forEach((pc, remoteUserId) => {
            this.addLocalTracks(pc);
            this.needsRenegotiation.add(remoteUserId);
          });
        }

        return stream;
      } catch (err) {
        let structuredError;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.microphonePermissionDenied = true;
          structuredError = {
            code: 'permission_denied',
            name: err.name,
            message: 'Microphone permission denied. Please allow microphone access in your browser.'
          };
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          structuredError = {
            code: 'device_not_found',
            name: err.name,
            message: 'No microphone input device was found on your machine.'
          };
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          structuredError = {
            code: 'hardware_error',
            name: err.name,
            message: 'Could not start audio source due to hardware or system contention.'
          };
        } else if (err.code === 'unsupported') {
          structuredError = err;
        } else {
          structuredError = {
            code: 'unknown',
            name: err.name || 'Error',
            message: err.message || 'Failed to access microphone.'
          };
        }

        this._notifyError(structuredError);
        throw structuredError;
      } finally {
        this.localAudioStartPromise = null;
      }
    })();

    return this.localAudioStartPromise;
  }

  /**
   * Stop all local audio tracks and release microphone resources
   */
  stopLocalAudio() {
    this._stopLocalSpeakingDetector();
    if (!this.localStream) return;
    try {
      if (typeof this.localStream.getTracks === 'function') {
        this.localStream.getTracks().forEach((track) => {
          if (typeof track.stop === 'function') {
            track.stop();
          }
        });
      }
    } catch (e) {
      // Safe cleanup catch
    }
    this.localStream = null;
  }

  /**
   * Set microphone mute state without stopping the MediaStream track
   * @param {boolean} isMuted
   * @returns {boolean} current mute state
   */
  setMuted(isMuted) {
    this.isMuted = !!isMuted;
    this._applyMuteToTracks();
    if (this.isMuted && this.isSpeaking) {
      this.isSpeaking = false;
      this._emitSpeakingStopped();
      if (typeof this.onLocalSpeakingChange === 'function') {
        this.onLocalSpeakingChange(false);
      }
    }
    return this.isMuted;
  }

  _applyMuteToTracks() {
    if (!this.localStream || typeof this.localStream.getAudioTracks !== 'function') return;
    const tracks = this.localStream.getAudioTracks();
    tracks.forEach((track) => {
      track.enabled = !this.isMuted;
    });
  }

  // ── 2B. REAL-TIME SPEAKING DETECTION (Phase 3C-3 Web Audio API) ────

  /**
   * Initialize Web Audio API speaking detector using existing localStream
   * @private
   */
  _initLocalSpeakingDetector() {
    if (this._speakingDetectionActive || !this.localStream || this.isDestroyed) return;

    const AudioContextClass = this._audioContextClass || (typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null);
    if (!AudioContextClass) {
      return; // Safe skip in environments without Web Audio API support
    }

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended' && typeof this.audioContext.resume === 'function') {
        this.audioContext.resume().catch(() => {});
      }

      if (typeof this.audioContext.createMediaStreamSource === 'function' && typeof this.audioContext.createAnalyser === 'function') {
        // Disconnect previous nodes if any
        if (this.localAudioSourceNode) {
          try {
            if (typeof this.localAudioSourceNode.disconnect === 'function') {
              this.localAudioSourceNode.disconnect();
            }
          } catch (e) {}
          this.localAudioSourceNode = null;
        }
        if (this.localAnalyserNode) {
          try {
            if (typeof this.localAnalyserNode.disconnect === 'function') {
              this.localAnalyserNode.disconnect();
            }
          } catch (e) {}
          this.localAnalyserNode = null;
        }

        this.localAudioSourceNode = this.audioContext.createMediaStreamSource(this.localStream);
        this.localAnalyserNode = this.audioContext.createAnalyser();
        this.localAnalyserNode.fftSize = 512;
        this.localAnalyserNode.smoothingTimeConstant = 0.4;
        this.localAudioSourceNode.connect(this.localAnalyserNode);

        this._startSpeakingAnalysisLoop();
      }
    } catch (err) {
      // Non-fatal Web Audio initialization error
    }
  }

  /**
   * Stop speaking detector loop and disconnect audio nodes
   * @private
   */
  _stopLocalSpeakingDetector() {
    this._speakingDetectionActive = false;

    if (this._speakingRafId) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._speakingRafId);
      }
      this._speakingRafId = null;
    }

    if (this._speakingTimeoutId) {
      clearTimeout(this._speakingTimeoutId);
      this._speakingTimeoutId = null;
    }

    if (this.localAudioSourceNode) {
      try {
        if (typeof this.localAudioSourceNode.disconnect === 'function') {
          this.localAudioSourceNode.disconnect();
        }
      } catch (e) {}
      this.localAudioSourceNode = null;
    }

    if (this.localAnalyserNode) {
      try {
        if (typeof this.localAnalyserNode.disconnect === 'function') {
          this.localAnalyserNode.disconnect();
        }
      } catch (e) {}
      this.localAnalyserNode = null;
    }

    if (this.isSpeaking) {
      this.isSpeaking = false;
      this._emitSpeakingStopped();
      if (typeof this.onLocalSpeakingChange === 'function') {
        this.onLocalSpeakingChange(false);
      }
    }
  }

  /**
   * Start recurring audio analysis loop via requestAnimationFrame (or setTimeout fallback)
   * @private
   */
  _startSpeakingAnalysisLoop() {
    this._speakingDetectionActive = true;

    const tick = () => {
      if (!this._speakingDetectionActive || this.isDestroyed) return;

      this._analyzeLocalAudio();

      if (!this._speakingDetectionActive || this.isDestroyed) return;

      if (typeof requestAnimationFrame === 'function') {
        this._speakingRafId = requestAnimationFrame(tick);
      } else {
        this._speakingTimeoutId = setTimeout(tick, 50);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      this._speakingRafId = requestAnimationFrame(tick);
    } else {
      this._speakingTimeoutId = setTimeout(tick, 50);
    }
  }

  /**
   * Analyze local microphone audio buffer and evaluate speaking threshold with debounce
   * @private
   */
  _analyzeLocalAudio() {
    if (!this._speakingDetectionActive || !this.localAnalyserNode || this.isDestroyed) return;

    if (this.isMuted) {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        this._emitSpeakingStopped();
        if (typeof this.onLocalSpeakingChange === 'function') {
          this.onLocalSpeakingChange(false);
        }
      }
      return;
    }

    const bufferLength = this.localAnalyserNode.fftSize || 512;
    const dataArray = new Uint8Array(bufferLength);
    if (typeof this.localAnalyserNode.getByteTimeDomainData === 'function') {
      this.localAnalyserNode.getByteTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      const now = Date.now();
      if (rms >= this.speakingThreshold) {
        this._lastSpokenTime = now;
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this._emitSpeakingStarted();
          if (typeof this.onLocalSpeakingChange === 'function') {
            this.onLocalSpeakingChange(true);
          }
        }
      } else {
        if (this.isSpeaking) {
          if (now - this._lastSpokenTime >= this.speakingDebounceMs) {
            this.isSpeaking = false;
            this._emitSpeakingStopped();
            if (typeof this.onLocalSpeakingChange === 'function') {
              this.onLocalSpeakingChange(false);
            }
          }
        }
      }
    }
  }

  /**
   * Synchronous trigger for audio analysis (useful for tests and instant queries)
   */
  analyzeSpeakingNow() {
    this._analyzeLocalAudio();
    return this.isSpeaking;
  }

  getLocalIsSpeaking() {
    return this.isSpeaking;
  }

  getRemoteSpeakingUsers() {
    return new Set(this.remoteSpeakingUsers);
  }

  isRemoteUserSpeaking(userId) {
    if (!userId) return false;
    const str = userId.toString();
    return this.remoteSpeakingUsers.has(str);
  }

  _emitSpeakingStarted() {
    if (this.socket && this.roomId && this.isPublisher && !this.isMuted) {
      this.socket.emit('room:speaking_started', {
        roomId: this.roomId,
        userId: this.currentUserId
      });
    }
  }

  _emitSpeakingStopped() {
    if (this.socket && this.roomId) {
      this.socket.emit('room:speaking_stopped', {
        roomId: this.roomId,
        userId: this.currentUserId
      });
    }
  }

  _handleSocketSpeakingStarted(data) {
    if (!data || data.roomId !== this.roomId) return;
    const userId = (data.userId || data.userMongoId || (data.user && (data.user.id || data.user._id)) || '').toString();
    const username = data.username || (data.user && data.user.username);
    if (!userId && !username) return;

    if (userId === this.currentUserId) return;

    if (userId) this.remoteSpeakingUsers.add(userId);
    if (data.userMongoId) this.remoteSpeakingUsers.add(data.userMongoId.toString());
    if (username) this.remoteSpeakingUsers.add(username);

    if (typeof this.onRemoteSpeakingChange === 'function') {
      this.onRemoteSpeakingChange(userId || username, true, new Set(this.remoteSpeakingUsers));
    }
  }

  _handleSocketSpeakingStopped(data) {
    if (!data || data.roomId !== this.roomId) return;
    const userId = (data.userId || data.userMongoId || (data.user && (data.user.id || data.user._id)) || '').toString();
    const username = data.username || (data.user && data.user.username);

    if (userId) this.remoteSpeakingUsers.delete(userId);
    if (data.userMongoId) this.remoteSpeakingUsers.delete(data.userMongoId.toString());
    if (username) this.remoteSpeakingUsers.delete(username);

    if (typeof this.onRemoteSpeakingChange === 'function') {
      this.onRemoteSpeakingChange(userId || username, false, new Set(this.remoteSpeakingUsers));
    }
  }

  getAudioContext() {
    return this.audioContext;
  }

  getLocalAnalyserNode() {
    return this.localAnalyserNode;
  }

  isSpeakingDetectorActive() {
    return !!this._speakingDetectionActive;
  }

  getLocalStream() {
    return this.localStream;
  }

  getIsMuted() {
    return this.isMuted;
  }

  getIsPublisher() {
    return this.isPublisher;
  }

  getIsHost() {
    return this.isHost;
  }

  getIsSpeaker() {
    return this.isSpeaker;
  }

  getNeedsRenegotiation() {
    return new Set(this.needsRenegotiation);
  }

  isNegotiating(remoteUserId) {
    return !!this.negotiationInProgress.get(remoteUserId);
  }

  hasPendingNegotiation(remoteUserId) {
    return !!this.pendingNegotiation.get(remoteUserId);
  }

  isPermissionDenied() {
    return this.microphonePermissionDenied;
  }

  // ── 3. RTCPeerConnection FOUNDATION ─────────────────────────────────

  /**
   * Create an RTCPeerConnection for a specific remote participant
   * @param {string} remoteUserId
   * @param {object} [customConfig]
   * @returns {RTCPeerConnection}
   */
  createPeerConnection(remoteUserId, customConfig = null) {
    if (!remoteUserId) {
      throw new Error('remoteUserId is required to create a peer connection');
    }

    // Duplicate check: if peer already exists, remove safely before replacing
    if (this.peers.has(remoteUserId)) {
      this.removePeer(remoteUserId);
    }

    const RTCPC = typeof RTCPeerConnection !== 'undefined'
      ? RTCPeerConnection
      : (globalThis.RTCPeerConnection || null);

    if (!RTCPC) {
      const error = {
        code: 'webrtc_unsupported',
        name: 'NotSupportedError',
        message: 'RTCPeerConnection is not supported in this environment.'
      };
      this._notifyError(error);
      throw error;
    }

    const config = customConfig || this.rtcConfig;
    const pc = new RTCPC(config);

    // Track ICE Candidate trickle
    pc.onicecandidate = (event) => {
      if (event && event.candidate) {
        this.sendIceCandidate(remoteUserId, event.candidate);
      }
    };

    // Remote Audio Stream handler
    pc.ontrack = (event) => {
      const streams = event.streams;
      if (streams && streams[0]) {
        const stream = streams[0];
        this.remoteStreams.set(remoteUserId, stream);
        if (this.onRemoteStream) {
          this.onRemoteStream(remoteUserId, stream);
        }
      }
    };

    // Connection & ICE state listeners
    pc.onconnectionstatechange = () => {
      if (this.onPeerStateChange) {
        this.onPeerStateChange(remoteUserId, pc.connectionState);
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(remoteUserId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        if (this.onPeerStateChange) {
          this.onPeerStateChange(remoteUserId, 'ice_failed');
        }
      }
    };

    // Automatically attach local audio tracks if microphone is active
    if (this.localStream) {
      this.addLocalTracks(pc);
    }

    this.peers.set(remoteUserId, pc);
    return pc;
  }

  /**
   * Attach local microphone audio tracks to a peer connection
   * @param {RTCPeerConnection} peerConnection
   */
  addLocalTracks(peerConnection) {
    if (!peerConnection || !this.localStream) return;
    if (typeof this.localStream.getAudioTracks !== 'function') return;

    const audioTracks = this.localStream.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) return;

    // Check existing senders to prevent duplicate track attachment
    const existingTracks = new Set();
    if (typeof peerConnection.getSenders === 'function') {
      peerConnection.getSenders().forEach((sender) => {
        if (sender && sender.track) {
          existingTracks.add(sender.track);
        }
      });
    }

    audioTracks.forEach((track) => {
      if (!existingTracks.has(track) && typeof peerConnection.addTrack === 'function') {
        peerConnection.addTrack(track, this.localStream);
      }
    });
  }

  /**
   * Remove local microphone audio tracks from a peer connection
   * @param {RTCPeerConnection} peerConnection
   */
  removeLocalTracks(peerConnection) {
    if (!peerConnection) return;
    if (typeof peerConnection.getSenders !== 'function') return;

    const senders = peerConnection.getSenders();
    senders.forEach((sender) => {
      if (sender && sender.track && typeof peerConnection.removeTrack === 'function') {
        try {
          peerConnection.removeTrack(sender);
        } catch (_) {
          // Safe track removal catch
        }
      }
    });
  }

  getPeer(remoteUserId) {
    return this.peers.get(remoteUserId) || null;
  }

  getRemoteStream(remoteUserId) {
    return this.remoteStreams.get(remoteUserId) || null;
  }

  getAllRemoteStreams() {
    return new Map(this.remoteStreams);
  }

  // ── 4. MULTI-USER OFFER / ANSWER / ICE NEGOTIATION ───────────────────

  /**
   * Perform mid-session WebRTC renegotiation for an existing peer connection
   * (Phase 3C-2 Mid-Session WebRTC Renegotiation)
   * @param {string} remoteUserId
   * @returns {Promise<boolean>} whether renegotiation was initiated
   */
  async renegotiate(remoteUserId) {
    if (!remoteUserId) return false;

    const pc = this.peers.get(remoteUserId);
    if (!pc || pc.closed || pc.signalingState === 'closed') {
      this.needsRenegotiation.delete(remoteUserId);
      this.negotiationInProgress.delete(remoteUserId);
      this.pendingNegotiation.delete(remoteUserId);
      return false;
    }

    // Role validation before negotiation:
    let remoteRole = null;
    let remoteIsPublisher = false;
    if (Array.isArray(this.latestParticipants)) {
      const p = this.latestParticipants.find((item) => (item.id || item._id) === remoteUserId);
      if (p) {
        remoteRole = p.role;
        remoteIsPublisher = (remoteRole === 'host' || remoteRole === 'speaker');
      }
    }

    // Listener <-> Listener: Never renegotiate!
    if (!this.isPublisher && !remoteIsPublisher && remoteRole === 'listener') {
      this.needsRenegotiation.delete(remoteUserId);
      this.removePeer(remoteUserId);
      return false;
    }

    // Publisher <-> Publisher: Deterministic offer ownership rule
    if (this.isPublisher && remoteIsPublisher) {
      const amIOfferer = this.currentUserId ? (this.currentUserId < remoteUserId) : true;
      if (!amIOfferer) {
        // We are the deterministic answerer; wait for remote offer
        return false;
      }
    }

    // Listener <- Publisher: Listener waits for publisher offer
    if (!this.isPublisher && remoteIsPublisher) {
      return false;
    }

    // Serialization & Queuing: If negotiation is in progress or peer is not in stable state, queue request
    if (this.negotiationInProgress.get(remoteUserId) || pc.signalingState !== 'stable' || this.makingOffer.get(remoteUserId)) {
      this.pendingNegotiation.set(remoteUserId, true);
      return false;
    }

    // Track reconciliation before offer
    if (this.isPublisher && this.localStream) {
      this.addLocalTracks(pc);
    } else if (!this.isPublisher) {
      this.removeLocalTracks(pc);
    }

    this.makingOffer.set(remoteUserId, true);
    this.negotiationInProgress.set(remoteUserId, true);

    try {
      const offer = await pc.createOffer();
      if (pc.closed || pc.signalingState === 'closed') return false;

      await pc.setLocalDescription(offer);
      this.sendOffer(remoteUserId, pc.localDescription);
      return true;
    } catch (err) {
      this.negotiationInProgress.delete(remoteUserId);
      this._notifyError({
        code: 'renegotiate_error',
        name: 'RenegotiateError',
        message: err.message || `Failed to renegotiate with ${remoteUserId}`
      });
      return false;
    } finally {
      this.makingOffer.set(remoteUserId, false);
    }
  }

  /**
   * Renegotiate all active peers that require updated media negotiation
   */
  async renegotiateAll() {
    const promises = [];
    for (const remoteUserId of this.peers.keys()) {
      promises.push(this.renegotiate(remoteUserId).catch(() => {}));
    }
    await Promise.all(promises);
  }

  /**
   * Initiate an SDP offer to a target remote participant
   * (Used only by authorized publishers or the deterministic publisher-to-publisher offerer)
   * @param {string} remoteUserId
   */
  async initiateOffer(remoteUserId) {
    if (!remoteUserId) return;
    if (this.makingOffer.get(remoteUserId)) return;

    let pc = this.peers.get(remoteUserId);
    if (!pc) {
      pc = this.createPeerConnection(remoteUserId);
    }

    if (this.isPublisher && this.localStream) {
      this.addLocalTracks(pc);
    }

    this.makingOffer.set(remoteUserId, true);
    this.negotiationInProgress.set(remoteUserId, true);

    try {
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') {
        // Guard against state changes during creation
      }
      await pc.setLocalDescription(offer);
      this.sendOffer(remoteUserId, pc.localDescription);
    } catch (err) {
      this.negotiationInProgress.delete(remoteUserId);
      this._notifyError({
        code: 'initiate_offer_error',
        name: 'InitiateOfferError',
        message: err.message || `Failed to create offer for ${remoteUserId}`
      });
    } finally {
      this.makingOffer.set(remoteUserId, false);
    }
  }

  /**
   * Handle an inbound SDP offer from a remote participant
   * (Receives offer -> sets remote description -> flushes ICE -> creates & sends answer)
   * @param {string} remoteUserId
   * @param {object} offerData
   */
  async handleOffer(remoteUserId, offerData) {
    if (!remoteUserId || !offerData) return;

    let pc = this.peers.get(remoteUserId);
    if (!pc || pc.closed || pc.signalingState === 'closed') {
      pc = this.createPeerConnection(remoteUserId);
    }

    // Deterministic collision handling if peer already has a local offer or is not in stable state
    const isOfferCollision = this.makingOffer.get(remoteUserId) || pc.signalingState !== 'stable';
    if (isOfferCollision) {
      // Deterministic comparison: user with smaller ID has priority to offer
      const amITheOfferer = this.currentUserId && (this.currentUserId < remoteUserId);
      if (amITheOfferer) {
        // Our offer has precedence; ignore incoming offer
        return;
      }
      // Otherwise remote user has precedence; rollback local description if supported
      try {
        if (typeof pc.setLocalDescription === 'function') {
          await pc.setLocalDescription({ type: 'rollback' });
        }
      } catch (rollbackErr) {
        // Rollback may not be implemented in all environments; proceed safely
      }
    }

    // Track reconciliation for answerer
    if (this.isPublisher && this.localStream) {
      this.addLocalTracks(pc);
    } else if (!this.isPublisher) {
      this.removeLocalTracks(pc);
    }

    const RTCSDesc = typeof RTCSessionDescription !== 'undefined'
      ? RTCSessionDescription
      : (globalThis.RTCSessionDescription || null);

    const desc = RTCSDesc ? new RTCSDesc(offerData) : offerData;

    try {
      await pc.setRemoteDescription(desc);

      // Flush any ICE candidates received before remote description was set
      await this._flushIceCandidateQueue(remoteUserId);

      // Create and send SDP answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendAnswer(remoteUserId, pc.localDescription);
      this.needsRenegotiation.delete(remoteUserId);
    } catch (err) {
      this._notifyError({
        code: 'handle_offer_error',
        name: 'OfferError',
        message: err.message || `Failed to handle offer from ${remoteUserId}`
      });
    } finally {
      this.negotiationInProgress.delete(remoteUserId);
    }

    // Process queued renegotiation if peer returned to stable state
    if (pc.signalingState === 'stable' && this.pendingNegotiation.get(remoteUserId)) {
      this.pendingNegotiation.delete(remoteUserId);
      this.renegotiate(remoteUserId).catch(() => {});
    }
  }

  /**
   * Handle an inbound SDP answer from a remote participant
   * (Applies remote description & flushes queued ICE candidates)
   * @param {string} remoteUserId
   * @param {object} answerData
   */
  async handleAnswer(remoteUserId, answerData) {
    if (!remoteUserId || !answerData) return;

    const pc = this.peers.get(remoteUserId);
    if (!pc || pc.closed || pc.signalingState === 'closed') {
      this.negotiationInProgress.delete(remoteUserId);
      return;
    }

    // Ignore duplicate or stale answers if connection is not expecting an answer
    if (pc.signalingState !== 'have-local-offer') {
      return;
    }

    const RTCSDesc = typeof RTCSessionDescription !== 'undefined'
      ? RTCSessionDescription
      : (globalThis.RTCSessionDescription || null);

    const desc = RTCSDesc ? new RTCSDesc(answerData) : answerData;

    try {
      await pc.setRemoteDescription(desc);

      // Flush any ICE candidates queued before answer was applied
      await this._flushIceCandidateQueue(remoteUserId);

      this.needsRenegotiation.delete(remoteUserId);
    } catch (err) {
      this._notifyError({
        code: 'handle_answer_error',
        name: 'AnswerError',
        message: err.message || `Failed to apply answer from ${remoteUserId}`
      });
    } finally {
      this.negotiationInProgress.delete(remoteUserId);
    }

    // Process queued / coalesced pending renegotiation if peer returned to stable state
    if (pc.signalingState === 'stable' && this.pendingNegotiation.get(remoteUserId)) {
      this.pendingNegotiation.delete(remoteUserId);
      this.renegotiate(remoteUserId).catch(() => {});
    }
  }

  /**
   * Handle an inbound ICE candidate from a remote participant
   * @param {string} remoteUserId
   * @param {object} candidateData
   */
  async handleIceCandidate(remoteUserId, candidateData) {
    if (!remoteUserId || !candidateData) return;

    const pc = this.peers.get(remoteUserId);
    if (!pc || pc.closed || pc.signalingState === 'closed') return;

    // If peer exists and has remote description, add candidate immediately
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        const RTCIceCand = typeof RTCIceCandidate !== 'undefined'
          ? RTCIceCandidate
          : (globalThis.RTCIceCandidate || null);
        const cand = RTCIceCand ? new RTCIceCand(candidateData) : candidateData;
        await pc.addIceCandidate(cand);
      } catch (err) {
        // Safe candidate drop
      }
    } else {
      // Otherwise queue candidate until setRemoteDescription completes
      if (!this.iceCandidateQueues.has(remoteUserId)) {
        this.iceCandidateQueues.set(remoteUserId, []);
      }
      this.iceCandidateQueues.get(remoteUserId).push(candidateData);
    }
  }

  /**
   * Flush queued ICE candidates for a remote participant
   * @private
   */
  async _flushIceCandidateQueue(remoteUserId) {
    const queue = this.iceCandidateQueues.get(remoteUserId);
    if (!queue || queue.length === 0) return;

    const pc = this.peers.get(remoteUserId);
    if (!pc || !pc.remoteDescription) return;

    const RTCIceCand = typeof RTCIceCandidate !== 'undefined'
      ? RTCIceCandidate
      : (globalThis.RTCIceCandidate || null);

    while (queue.length > 0) {
      const candData = queue.shift();
      try {
        const cand = RTCIceCand ? new RTCIceCand(candData) : candData;
        await pc.addIceCandidate(cand);
      } catch (err) {
        // Safe candidate drop
      }
    }
  }

  /**
   * Synchronize active room participants to create or teardown peer connections
   * Controlled architecture:
   * - Host / Speaker -> Listener: Publisher initiates offer
   * - Publisher <-> Publisher: Deterministic comparison (smaller userId offers)
   * - Listener <-> Listener: Never connected (pruned if previously connected)
   * @param {Array<{ id: string, role: string }>} participants
   */
  async syncParticipants(participants = []) {
    if (!Array.isArray(participants)) return;
    this.latestParticipants = participants;

    const activeRemoteIds = new Set();

    for (const p of participants) {
      const pId = p.id || (p._id ? p._id.toString() : '');
      if (!pId || pId === this.currentUserId) continue;

      activeRemoteIds.add(pId);

      const remoteIsPublisher = (p.role === 'host' || p.role === 'speaker');
      const currentIsPublisher = this.isPublisher;

      // Listener <-> Listener: Never connected. If an existing peer exists (e.g. after demotion), remove safely!
      if (!currentIsPublisher && !remoteIsPublisher) {
        if (this.peers.has(pId)) {
          this.removePeer(pId);
        }
        continue;
      }

      // Publisher -> Listener: Current publisher initiates offer if peer not yet created
      if (currentIsPublisher && !remoteIsPublisher) {
        if (!this.peers.has(pId)) {
          await this.initiateOffer(pId).catch(() => {});
        }
        continue;
      }

      // Listener <- Publisher: Listener waits for offer from publisher
      if (!currentIsPublisher && remoteIsPublisher) {
        continue;
      }

      // Publisher <-> Publisher: Deterministic offer ownership
      if (currentIsPublisher && remoteIsPublisher) {
        // Compare user IDs deterministically
        const amIOfferer = this.currentUserId ? (this.currentUserId < pId) : true;
        if (amIOfferer) {
          if (!this.peers.has(pId)) {
            await this.initiateOffer(pId).catch(() => {});
          }
        }
        // If not offerer, wait for remote publisher to send offer
      }
    }

    // Teardown peers for participants who have left the room
    const existingPeerIds = Array.from(this.peers.keys());
    existingPeerIds.forEach((peerId) => {
      if (!activeRemoteIds.has(peerId)) {
        this.removePeer(peerId);
      }
    });
  }

  // ── 5. PHASE 2 SIGNALING RELAY EMITTERS ─────────────────────────────

  /**
   * Send WebRTC offer to target user via Phase 2 room:webrtc_offer event
   * @param {string} targetUserId
   * @param {RTCSessionDescriptionInit|object} offer
   */
  sendOffer(targetUserId, offer) {
    if (!this.socket || !targetUserId || !offer) return;
    this.socket.emit('room:webrtc_offer', {
      roomId: this.roomId,
      targetUserId,
      offer,
      sdp: offer
    });
  }

  /**
   * Send WebRTC answer to target user via Phase 2 room:webrtc_answer event
   * @param {string} targetUserId
   * @param {RTCSessionDescriptionInit|object} answer
   */
  sendAnswer(targetUserId, answer) {
    if (!this.socket || !targetUserId || !answer) return;
    this.socket.emit('room:webrtc_answer', {
      roomId: this.roomId,
      targetUserId,
      answer,
      sdp: answer
    });
  }

  /**
   * Send ICE candidate to target user via Phase 2 room:webrtc_ice_candidate event
   * @param {string} targetUserId
   * @param {RTCIceCandidateInit|object} candidate
   */
  sendIceCandidate(targetUserId, candidate) {
    if (!this.socket || !targetUserId || !candidate) return;
    this.socket.emit('room:webrtc_ice_candidate', {
      roomId: this.roomId,
      targetUserId,
      candidate
    });
  }

  // ── 6. PEER CLEANUP & TEARDOWN ──────────────────────────────────────

  /**
   * Safely teardown and remove a single remote peer connection
   * @param {string} remoteUserId
   */
  removePeer(remoteUserId) {
    if (!remoteUserId) return;

    const pc = this.peers.get(remoteUserId);
    if (pc) {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        if (typeof pc.close === 'function') {
          pc.close();
        }
      } catch (e) {
        // Safe close catch
      }
      this.peers.delete(remoteUserId);
    }

    if (this.remoteStreams.has(remoteUserId)) {
      this.remoteStreams.delete(remoteUserId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(remoteUserId);
      }
    }

    this.iceCandidateQueues.delete(remoteUserId);
    this.makingOffer.delete(remoteUserId);
    if (this.needsRenegotiation) {
      this.needsRenegotiation.delete(remoteUserId);
    }
    if (this.negotiationInProgress) {
      this.negotiationInProgress.delete(remoteUserId);
    }
    if (this.pendingNegotiation) {
      this.pendingNegotiation.delete(remoteUserId);
    }
  }

  /**
   * Close and cleanup all peer connections in this room session
   */
  cleanupAllPeers() {
    const userIds = Array.from(this.peers.keys());
    userIds.forEach((id) => this.removePeer(id));
    this.peers.clear();
    this.remoteStreams.clear();
    this.iceCandidateQueues.clear();
    this.makingOffer.clear();
    this.remoteSpeakingUsers.clear();
    if (this.needsRenegotiation) {
      this.needsRenegotiation.clear();
    }
    if (this.negotiationInProgress) {
      this.negotiationInProgress.clear();
    }
    if (this.pendingNegotiation) {
      this.pendingNegotiation.clear();
    }
  }

  /**
   * Full teardown of the manager (called on room exit / unmount)
   */
  destroy() {
    this.isDestroyed = true;
    this._demotionGeneration++;
    this._unregisterSocketListeners();
    this.cleanupAllPeers();
    this._stopLocalSpeakingDetector();
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      try {
        this.audioContext.close().catch(() => {});
      } catch (e) {}
      this.audioContext = null;
    }
    this.stopLocalAudio();
    this.localAudioStartPromise = null;
    this.latestParticipants = [];
    if (this.negotiationInProgress) {
      this.negotiationInProgress.clear();
    }
    if (this.pendingNegotiation) {
      this.pendingNegotiation.clear();
    }
    this.socket = null;
    this.onLocalSpeakingChange = null;
  }

  _notifyError(err) {
    if (typeof this.onError === 'function') {
      this.onError(err);
    }
  }
}

/**
 * Factory helper for clean instantiation
 */
export function createGroupWebRTCManager(options) {
  return new GroupWebRTCManager(options);
}

export default GroupWebRTCManager;
