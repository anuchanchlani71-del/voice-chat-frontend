import React from 'react';

/**
 * Voice Chat & Friends — Reference-Extracted High-Fidelity Vector Artworks
 * Palette sampled directly from reference images:
 * - Background Atmosphere: #120324 / #1C0633 (Deep Royal Midnight Violet)
 * - Card / Screen Surfaces: #260A42 / #360E5E (Deep Violet Glass)
 * - Voice & Mic Centerpiece: #FF3385 / #FF4081 / #FF5EAC (Hot Magenta-Pink)
 * - Secondary Accent: #8B2FC9 / #D896FF (Royal Violet / Electric Lilac)
 * - Borders: #4A1570
 * - Status: #00F5D4 (Electric Cyan-Mint)
 */

// ── 1. Hero 3D Isometric Voice Interface Artwork ──────────────────────────────────────
export function HeroVoiceStageArtwork({ className = '', style = {} }) {
  return (
    <div
      className={`hero-artwork-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Ambient Lighting Gradients */}
          <radialGradient id="heroGlowAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#FF3385" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>

          {/* Glowing 3D Microphone Orb Gradient (Extracted Hot Magenta-Pink) */}
          <radialGradient id="micSphereGlow" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFA3CC" />
            <stop offset="35%" stopColor="#FF4081" />
            <stop offset="75%" stopColor="#E60067" />
            <stop offset="100%" stopColor="#780036" />
          </radialGradient>

          <radialGradient id="micHaloGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#8B2FC9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>

          {/* Smartphone Isometric Chassis Gradients */}
          <linearGradient id="phoneBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#360E5E" />
            <stop offset="45%" stopColor="#260A42" />
            <stop offset="100%" stopColor="#150428" />
          </linearGradient>

          <linearGradient id="phoneBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3385" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#8B2FC9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4A1570" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="screenGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A0B4A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#18052E" stopOpacity="0.98" />
          </linearGradient>

          {/* Audio Waveform Linear Gradients */}
          <linearGradient id="waveRibbonPinkViolet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.1" />
            <stop offset="30%" stopColor="#FF4081" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#8B2FC9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5D109E" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="waveRibbonLilac" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#D896FF" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#FF5EAC" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FF3385" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="bubbleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3C1361" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#230A3B" stopOpacity="0.96" />
          </linearGradient>

          <linearGradient id="bubbleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#300F4F" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#1D0631" stopOpacity="0.96" />
          </linearGradient>

          {/* Filters for Depth & Shadows */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#000000" floodOpacity="0.8" />
          </filter>

          <filter id="micShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="20" floodColor="#FF4081" floodOpacity="0.6" />
          </filter>

          <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.7" />
          </filter>

          <filter id="blurAura" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
        </defs>

        {/* ── Layer 1: Ambient Glowing Backdrop Aura ── */}
        <circle cx="270" cy="250" r="230" fill="url(#heroGlowAura)" filter="url(#blurAura)" />

        {/* ── Layer 2: Organic Sinusoidal Wave Filaments (Exact Reference Flow) ── */}
        <g opacity="0.9">
          {/* Primary Wave Ribbon */}
          <path
            d="M 10 320 C 110 240, 180 380, 270 300 C 360 220, 430 360, 530 280"
            stroke="url(#waveRibbonPinkViolet)"
            strokeWidth="3.8"
            fill="none"
            strokeLinecap="round"
          />
          {/* Secondary Higher Frequency Ribbon */}
          <path
            d="M 20 270 C 130 370, 210 230, 290 330 C 370 430, 440 250, 520 310"
            stroke="url(#waveRibbonLilac)"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity="0.85"
          />
          {/* Fine Audio Filament 1 */}
          <path
            d="M 30 220 C 140 160, 200 290, 310 210 C 400 140, 460 270, 530 190"
            stroke="rgba(255, 64, 129, 0.55)"
            strokeWidth="1.6"
            fill="none"
          />
          {/* Fine Audio Filament 2 */}
          <path
            d="M 15 380 C 120 440, 220 310, 320 400 C 410 480, 470 340, 525 390"
            stroke="rgba(139, 47, 201, 0.5)"
            strokeWidth="1.6"
            fill="none"
          />
        </g>

        {/* ── Layer 3: Dimensional Isometric Phone Chassis ── */}
        <g transform="translate(145, 45) rotate(4, 130, 195)" filter="url(#softShadow)">
          {/* Outer Phone Bezel */}
          <rect
            x="0"
            y="0"
            width="250"
            height="390"
            rx="42"
            fill="url(#phoneBodyGrad)"
            stroke="url(#phoneBezelGrad)"
            strokeWidth="2.5"
          />

          {/* Inner Screen Area */}
          <rect
            x="10"
            y="10"
            width="230"
            height="370"
            rx="34"
            fill="url(#screenGlassGrad)"
            stroke="rgba(74, 21, 112, 0.9)"
            strokeWidth="1.5"
          />

          {/* Top Speaker Notch */}
          <rect x="92" y="20" width="66" height="6" rx="3" fill="#4A1570" opacity="0.9" />

          {/* Live Status Top Bar */}
          <g transform="translate(26, 42)">
            <circle cx="6" cy="6" r="4" fill="#00F5D4" />
            <text x="16" y="10" fill="#D4BEE4" fontSize="11" fontWeight="700" fontFamily="sans-serif">
              VOICE LOUNGE
            </text>
            <text x="145" y="10" fill="#FF5EAC" fontSize="10" fontWeight="600" fontFamily="sans-serif">
              12 Online
            </text>
          </g>

          {/* Center Sound Spectrogram on Phone Screen */}
          <g transform="translate(30, 95)" opacity="0.95">
            <rect x="10" y="24" width="4" height="22" rx="2" fill="#FF3385" />
            <rect x="20" y="14" width="4" height="42" rx="2" fill="#FF4081" />
            <rect x="30" y="6" width="4" height="58" rx="2" fill="#FF5EAC" />
            <rect x="40" y="18" width="4" height="34" rx="2" fill="#8B2FC9" />
            <rect x="50" y="2" width="4" height="66" rx="2" fill="#FFA3CC" />
            <rect x="60" y="10" width="4" height="50" rx="2" fill="#FF4081" />
            <rect x="70" y="22" width="4" height="26" rx="2" fill="#D896FF" />
            <rect x="80" y="8" width="4" height="54" rx="2" fill="#8B2FC9" />
            <rect x="90" y="16" width="4" height="38" rx="2" fill="#FF3385" />
            <rect x="100" y="26" width="4" height="18" rx="2" fill="#FF5EAC" />
            <rect x="110" y="12" width="4" height="46" rx="2" fill="#FFA3CC" />
            <rect x="120" y="4" width="4" height="62" rx="2" fill="#FF4081" />
            <rect x="130" y="20" width="4" height="30" rx="2" fill="#8B2FC9" />
            <rect x="140" y="14" width="4" height="42" rx="2" fill="#D896FF" />
            <rect x="150" y="28" width="4" height="14" rx="2" fill="#FF3385" />
          </g>

          {/* Subtitle / Topic tag */}
          <g transform="translate(25, 205)">
            <rect x="0" y="0" width="200" height="26" rx="13" fill="rgba(255, 51, 133, 0.15)" stroke="rgba(255, 51, 133, 0.4)" />
            <text x="100" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="600" fontFamily="sans-serif">
              🎧 Late Night Lo-Fi &amp; Talks
            </text>
          </g>
        </g>

        {/* ── Layer 4: Floating Translucent Speech Capsule (Top Left) ── */}
        <g transform="translate(30, 85)" filter="url(#pillShadow)" className="floating-capsule-anim-1">
          <rect
            x="0"
            y="0"
            width="220"
            height="68"
            rx="20"
            fill="url(#bubbleGrad1)"
            stroke="rgba(255, 64, 129, 0.55)"
            strokeWidth="1.5"
          />
          {/* Avatar Icon */}
          <circle cx="34" cy="34" r="20" fill="url(#micSphereGlow)" />
          <text x="34" y="40" textAnchor="middle" fontSize="18">🎧</text>
          
          {/* Speaker Text */}
          <text x="64" y="29" fill="#FFFFFF" fontSize="12.5" fontWeight="700" fontFamily="sans-serif">
            Maya Chen
          </text>
          <text x="145" y="28" fill="#FF4081" fontSize="10" fontWeight="700" fontFamily="sans-serif">
            ● Speaking
          </text>

          {/* Animated Waveform Inside Capsule */}
          <g transform="translate(64, 38)">
            <rect x="0" y="6" width="3" height="12" rx="1.5" fill="#FF4081" />
            <rect x="6" y="2" width="3" height="20" rx="1.5" fill="#FFA3CC" />
            <rect x="12" y="8" width="3" height="8" rx="1.5" fill="#8B2FC9" />
            <rect x="18" y="0" width="3" height="24" rx="1.5" fill="#FF4081" />
            <rect x="24" y="4" width="3" height="16" rx="1.5" fill="#FF5EAC" />
            <rect x="30" y="10" width="3" height="6" rx="1.5" fill="#D896FF" />
            <rect x="36" y="2" width="3" height="20" rx="1.5" fill="#FF4081" />
            <rect x="42" y="7" width="3" height="10" rx="1.5" fill="#FFA3CC" />
            <rect x="48" y="1" width="3" height="22" rx="1.5" fill="#8B2FC9" />
            <rect x="54" y="5" width="3" height="14" rx="1.5" fill="#FF4081" />
            <rect x="60" y="9" width="3" height="7" rx="1.5" fill="#FF5EAC" />
            <rect x="66" y="3" width="3" height="18" rx="1.5" fill="#FFA3CC" />
            <rect x="72" y="8" width="3" height="9" rx="1.5" fill="#FF4081" />
            <rect x="78" y="2" width="3" height="20" rx="1.5" fill="#8B2FC9" />
            <rect x="84" y="6" width="3" height="12" rx="1.5" fill="#FF5EAC" />
            <rect x="90" y="0" width="3" height="24" rx="1.5" fill="#FF4081" />
            <rect x="96" y="8" width="3" height="8" rx="1.5" fill="#FFA3CC" />
            <rect x="102" y="4" width="3" height="16" rx="1.5" fill="#D896FF" />
            <rect x="108" y="10" width="3" height="5" rx="1.5" fill="#FF4081" />
            <rect x="114" y="2" width="3" height="20" rx="1.5" fill="#FF5EAC" />
            <rect x="120" y="6" width="3" height="12" rx="1.5" fill="#FFA3CC" />
            <rect x="126" y="1" width="3" height="22" rx="1.5" fill="#FF4081" />
            <rect x="132" y="7" width="3" height="10" rx="1.5" fill="#8B2FC9" />
            <rect x="138" y="4" width="3" height="16" rx="1.5" fill="#FF5EAC" />
          </g>
        </g>

        {/* ── Layer 5: Glowing Hot Magenta-Pink 3D Microphone Sphere Centerpiece ── */}
        <g transform="translate(270, 310)" className="glowing-mic-pulse">
          {/* Radial Sound Pulse Waves */}
          <circle cx="0" cy="0" r="70" fill="none" stroke="rgba(255, 64, 129, 0.3)" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="0" cy="0" r="55" fill="none" stroke="rgba(139, 47, 201, 0.45)" strokeWidth="1.5" />
          
          {/* Ambient Drop Glow */}
          <circle cx="0" cy="0" r="46" fill="url(#micHaloGlow)" filter="url(#micShadow)" />

          {/* 3D Sphere Body */}
          <circle cx="0" cy="0" r="38" fill="url(#micSphereGlow)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />

          {/* Glossy Top Specular Highlight */}
          <ellipse cx="-8" cy="-14" rx="16" ry="8" fill="rgba(255, 255, 255, 0.5)" transform="rotate(-20, -8, -14)" />

          {/* Crisp Microphone SVG Icon */}
          <g transform="translate(-14, -14) scale(1.15)" stroke="#120324" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <rect x="8" y="2" width="8" height="13" rx="4" fill="#120324" />
            <path d="M4 10 C4 15.5, 20 15.5, 20 10" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </g>
        </g>

        {/* ── Layer 6: Floating Speech Capsule 2 (Bottom Right Friend Join) ── */}
        <g transform="translate(300, 375)" filter="url(#pillShadow)" className="floating-capsule-anim-2">
          <rect
            x="0"
            y="0"
            width="215"
            height="62"
            rx="18"
            fill="url(#bubbleGrad2)"
            stroke="rgba(139, 47, 201, 0.6)"
            strokeWidth="1.5"
          />
          {/* Avatar Icon */}
          <circle cx="30" cy="31" r="18" fill="linear-gradient(135deg, #FF4081, #8B2FC9)" />
          <text x="30" y="37" textAnchor="middle" fontSize="16">✨</text>
          
          {/* Text Content */}
          <text x="58" y="27" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="sans-serif">
            Lucas joined stage
          </text>
          <text x="58" y="44" fill="#D4BEE4" fontSize="10" fontFamily="sans-serif">
            Mutual Friend &bull; 🎙️ Mic Unmuted
          </text>
        </g>

        {/* ── Layer 7: Floating Sparkle / Acoustic Particles ── */}
        <g fill="#FFA3CC" opacity="0.9">
          <path d="M 120 40 L 123 48 L 131 51 L 123 54 L 120 62 L 117 54 L 109 51 L 117 48 Z" />
          <path d="M 440 130 L 442 135 L 447 137 L 442 139 L 440 144 L 438 139 L 433 137 L 438 135 Z" fill="#D896FF" />
          <circle cx="75" cy="240" r="3" fill="#FF4081" opacity="0.8" />
          <circle cx="480" cy="250" r="3.5" fill="#8B2FC9" opacity="0.7" />
          <circle cx="210" cy="460" r="2.5" fill="#FFA3CC" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

// ── 2. Editorial Social People Connection Illustration (Reference 2 Inspired) ──────────
export function PeopleVoiceConnectionIllustration({ className = '', style = {} }) {
  return (
    <div
      className={`people-illustration-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto 20px',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 520 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="peopleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#FF4081" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="char1Body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4081" />
            <stop offset="100%" stopColor="#8B2FC9" />
          </linearGradient>

          <linearGradient id="char2Body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B2FC9" />
            <stop offset="100%" stopColor="#5D109E" />
          </linearGradient>

          <linearGradient id="waveFilamentBridge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFA3CC" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0.9" />
          </linearGradient>

          <filter id="charShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <ellipse cx="260" cy="170" rx="220" ry="140" fill="url(#peopleGlow)" />

        {/* Background Organic Sound Curves */}
        <path
          d="M 60 170 C 140 100, 200 230, 260 160 C 320 90, 380 220, 460 150"
          stroke="url(#waveFilamentBridge)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 80 200 C 160 140, 220 250, 280 180 C 340 110, 400 230, 440 180"
          stroke="rgba(255, 64, 129, 0.45)"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          fill="none"
        />

        {/* ── Character 1 (Left - Friendly Voice Speaker) ── */}
        <g transform="translate(70, 70)" filter="url(#charShadow)">
          {/* Head & Hair */}
          <circle cx="50" cy="40" r="26" fill="#FBD5C2" />
          <path d="M 28 36 C 28 16, 72 16, 72 36 C 72 44, 66 52, 50 52 C 34 52, 28 44, 28 36 Z" fill="#260A42" />
          
          {/* Chic Headphone Band & Ear Cups */}
          <path d="M 24 38 C 24 16, 76 16, 76 38" stroke="#FF4081" strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="20" y="32" width="10" height="18" rx="5" fill="#FF4081" />
          <rect x="70" y="32" width="10" height="18" rx="5" fill="#FF4081" />

          {/* Torso & Warm Jacket */}
          <path d="M 18 130 C 18 80, 82 80, 82 130 Z" fill="url(#char1Body)" />
          {/* Collar Accent */}
          <path d="M 40 82 L 50 100 L 60 82 Z" fill="#FFFFFF" opacity="0.9" />

          {/* Floating Speaking Microphone */}
          <g transform="translate(68, 62)">
            <circle cx="16" cy="16" r="14" fill="#1C0633" stroke="#FF4081" strokeWidth="2" />
            <path d="M 12 11 C 12 8, 20 8, 20 11 L 20 16 C 20 19, 12 19, 12 16 Z" fill="#FF4081" />
            <path d="M 9 14 C 9 18, 23 18, 23 14" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Live Ripple Rings from Mic */}
            <circle cx="16" cy="16" r="20" stroke="rgba(255, 64, 129, 0.45)" strokeWidth="1.5" fill="none" />
          </g>
        </g>

        {/* ── Center Conversational Audio Bridge & Waveform Bars ── */}
        <g transform="translate(210, 115)">
          <rect x="0" y="0" width="100" height="54" rx="16" fill="rgba(38, 10, 66, 0.92)" stroke="rgba(255, 64, 129, 0.4)" strokeWidth="1.5" />
          <text x="50" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">
            LIVE AUDIO
          </text>
          {/* Audio Visualizer */}
          <g transform="translate(20, 26)">
            <rect x="0" y="4" width="3.5" height="14" rx="1.75" fill="#FF4081" />
            <rect x="7" y="0" width="3.5" height="22" rx="1.75" fill="#FFA3CC" />
            <rect x="14" y="6" width="3.5" height="10" rx="1.75" fill="#8B2FC9" />
            <rect x="21" y="2" width="3.5" height="18" rx="1.75" fill="#FF4081" />
            <rect x="28" y="5" width="3.5" height="12" rx="1.75" fill="#FF5EAC" />
            <rect x="35" y="1" width="3.5" height="20" rx="1.75" fill="#FFA3CC" />
            <rect x="42" y="7" width="3.5" height="8" rx="1.75" fill="#D896FF" />
            <rect x="49" y="3" width="3.5" height="16" rx="1.75" fill="#8B2FC9" />
            <rect x="56" y="0" width="3.5" height="22" rx="1.75" fill="#FF4081" />
          </g>
        </g>

        {/* ── Character 2 (Right - Smiling Listener Friend) ── */}
        <g transform="translate(350, 70)" filter="url(#charShadow)">
          {/* Head & Curly Hair */}
          <circle cx="50" cy="40" r="26" fill="#D4A373" />
          <path d="M 26 38 C 24 14, 76 14, 74 38 C 74 48, 68 54, 50 54 C 32 54, 26 48, 26 38 Z" fill="#1C0633" />
          <circle cx="34" cy="24" r="8" fill="#1C0633" />
          <circle cx="66" cy="24" r="8" fill="#1C0633" />

          {/* Modern Headset */}
          <path d="M 24 38 C 24 16, 76 16, 76 38" stroke="#8B2FC9" strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="20" y="32" width="10" height="18" rx="5" fill="#8B2FC9" />
          <rect x="70" y="32" width="10" height="18" rx="5" fill="#8B2FC9" />

          {/* Torso & Casual Hoodie */}
          <path d="M 18 130 C 18 80, 82 80, 82 130 Z" fill="url(#char2Body)" />
          {/* Hoodie Strings */}
          <line x1="44" y1="88" x2="44" y2="108" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <line x1="56" y1="88" x2="56" y2="108" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        </g>

        {/* Floating Sparks / Social Badges */}
        <g fill="#FF5EAC" opacity="0.85">
          <circle cx="110" cy="50" r="3" />
          <circle cx="410" cy="55" r="3.5" fill="#8B2FC9" />
          <path d="M 260 55 L 262 61 L 268 63 L 262 65 L 260 71 L 258 65 L 252 63 L 258 61 Z" fill="#FFA3CC" />
        </g>
      </svg>
    </div>
  );
}

// ── 3. Hero Slide 3 Friends Voice Security Artwork (Exact 540x500 Canvas) ─────────────
export function HeroFriendsVoiceSecurityArtwork({ className = '', style = {} }) {
  return (
    <div
      className={`hero-artwork-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="friendsGlowAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FF3385" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="char1Body3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4081" />
            <stop offset="100%" stopColor="#8B2FC9" />
          </linearGradient>

          <linearGradient id="char2Body3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B2FC9" />
            <stop offset="100%" stopColor="#5D109E" />
          </linearGradient>

          <linearGradient id="waveFilamentBridge3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFA3CC" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0.9" />
          </linearGradient>

          <filter id="charShadow3" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* ── Layer 1: Ambient Backdrop Glow ── */}
        <circle cx="270" cy="250" r="230" fill="url(#friendsGlowAura)" filter="url(#blurAura)" />

        {/* ── Layer 2: Organic Sinusoidal Audio Ribbons ── */}
        <g opacity="0.85">
          <path
            d="M 20 300 C 120 200, 200 380, 300 260 C 400 140, 460 340, 530 240"
            stroke="url(#waveFilamentBridge3)"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 40 360 C 140 260, 240 440, 340 320 C 420 200, 480 380, 535 310"
            stroke="rgba(216, 150, 255, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="6 4"
            fill="none"
          />
        </g>

        {/* ── Layer 3: Central Safe HD Audio Security Hub ── */}
        <g transform="translate(195, 180)" filter="url(#pillShadow)" className="glowing-mic-pulse">
          {/* Outer Shield Pill */}
          <rect
            x="0"
            y="0"
            width="150"
            height="140"
            rx="28"
            fill="rgba(38, 10, 66, 0.94)"
            stroke="rgba(255, 64, 129, 0.5)"
            strokeWidth="2"
          />
          {/* Top Security Status */}
          <g transform="translate(20, 20)">
            <circle cx="6" cy="6" r="4" fill="#00F5D4" />
            <text x="18" y="10" fill="#D4BEE4" fontSize="10" fontWeight="700" fontFamily="sans-serif">
              ENCRYPTED VOICE
            </text>
          </g>

          {/* Central Mic Icon Circle */}
          <circle cx="75" cy="72" r="26" fill="url(#micSphereGlow)" stroke="#FFFFFF" strokeWidth="1.5" />
          <g transform="translate(63, 60) scale(1)" stroke="#120324" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <rect x="8" y="2" width="8" height="13" rx="4" fill="#120324" />
            <path d="M4 10 C4 15.5, 20 15.5, 20 10" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </g>

          {/* Bottom Waveform Visualizer */}
          <g transform="translate(35, 110)">
            <rect x="0" y="3" width="3" height="12" rx="1.5" fill="#FF4081" />
            <rect x="8" y="0" width="3" height="18" rx="1.5" fill="#FFA3CC" />
            <rect x="16" y="5" width="3" height="8" rx="1.5" fill="#8B2FC9" />
            <rect x="24" y="1" width="3" height="16" rx="1.5" fill="#FF4081" />
            <rect x="32" y="4" width="3" height="10" rx="1.5" fill="#D896FF" />
            <rect x="40" y="0" width="3" height="18" rx="1.5" fill="#FFA3CC" />
            <rect x="48" y="3" width="3" height="12" rx="1.5" fill="#8B2FC9" />
            <rect x="56" y="1" width="3" height="16" rx="1.5" fill="#FF4081" />
            <rect x="64" y="4" width="3" height="10" rx="1.5" fill="#D896FF" />
            <rect x="72" y="0" width="3" height="18" rx="1.5" fill="#FFA3CC" />
          </g>
        </g>

        {/* ── Layer 4: Character 1 (Left - Friendly Voice Speaker) ── */}
        <g transform="translate(45, 140)" filter="url(#charShadow3)" className="floating-capsule-anim-1">
          {/* Head & Hair */}
          <circle cx="50" cy="40" r="28" fill="#FBD5C2" />
          <path d="M 26 36 C 26 14, 74 14, 74 36 C 74 46, 68 54, 50 54 C 32 54, 26 46, 26 36 Z" fill="#260A42" />
          
          {/* Chic Headphone Band & Ear Cups */}
          <path d="M 22 38 C 22 14, 78 14, 78 38" stroke="#FF4081" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <rect x="18" y="32" width="11" height="20" rx="5.5" fill="#FF4081" />
          <rect x="71" y="32" width="11" height="20" rx="5.5" fill="#FF4081" />

          {/* Torso & Warm Jacket */}
          <path d="M 14 145 C 14 90, 86 90, 86 145 Z" fill="url(#char1Body3)" />
          {/* Collar Accent */}
          <path d="M 40 92 L 50 112 L 60 92 Z" fill="#FFFFFF" opacity="0.9" />

          {/* Name Tag Pill */}
          <g transform="translate(-10, 155)">
            <rect x="0" y="0" width="120" height="26" rx="13" fill="rgba(38, 10, 66, 0.9)" stroke="#FF4081" strokeWidth="1.5" />
            <text x="60" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">
              Alex &bull; Talking 🎙️
            </text>
          </g>
        </g>

        {/* ── Layer 5: Character 2 (Right - Smiling Listener Friend) ── */}
        <g transform="translate(375, 140)" filter="url(#charShadow3)" className="floating-capsule-anim-2">
          {/* Head & Curly Hair */}
          <circle cx="50" cy="40" r="28" fill="#D4A373" />
          <path d="M 24 38 C 22 12, 78 12, 76 38 C 76 50, 70 56, 50 56 C 30 56, 24 50, 24 38 Z" fill="#1C0633" />
          <circle cx="32" cy="22" r="9" fill="#1C0633" />
          <circle cx="68" cy="22" r="9" fill="#1C0633" />

          {/* Modern Headset */}
          <path d="M 22 38 C 22 14, 78 14, 78 38" stroke="#8B2FC9" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <rect x="18" y="32" width="11" height="20" rx="5.5" fill="#8B2FC9" />
          <rect x="71" y="32" width="11" height="20" rx="5.5" fill="#8B2FC9" />

          {/* Torso & Casual Hoodie */}
          <path d="M 14 145 C 14 90, 86 90, 86 145 Z" fill="url(#char2Body3)" />
          <line x1="44" y1="98" x2="44" y2="120" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="56" y1="98" x2="56" y2="120" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

          {/* Name Tag Pill */}
          <g transform="translate(-10, 155)">
            <rect x="0" y="0" width="120" height="26" rx="13" fill="rgba(38, 10, 66, 0.9)" stroke="#8B2FC9" strokeWidth="1.5" />
            <text x="60" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">
              Maya &bull; Listening 🎧
            </text>
          </g>
        </g>

        {/* ── Layer 6: Floating Sparkles ── */}
        <g fill="#FFA3CC" opacity="0.9">
          <path d="M 120 60 L 123 68 L 131 71 L 123 74 L 120 82 L 117 74 L 109 71 L 117 68 Z" fill="#FF5EAC" />
          <circle cx="430" cy="80" r="3.5" fill="#D896FF" />
          <circle cx="85" cy="380" r="3" fill="#FF4081" />
          <circle cx="470" cy="390" r="3.5" fill="#8B2FC9" />
        </g>
      </svg>
    </div>
  );
}

// ── 3. Celebration Audio Artwork (For Setup Complete) ──────────────────────────────────
export function CelebrationVoiceArtwork({ className = '', style = {} }) {
  return (
    <div
      className={`celebration-artwork-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 240,
        margin: '0 auto 18px',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <radialGradient id="celebGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#8B2FC9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="celebBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA3CC" />
            <stop offset="50%" stopColor="#FF4081" />
            <stop offset="100%" stopColor="#8B2FC9" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="90" r="85" fill="url(#celebGlow)" />
        
        {/* Animated Radial Audio Rings */}
        <circle cx="100" cy="90" r="62" stroke="rgba(255, 64, 129, 0.4)" strokeWidth="1.5" strokeDasharray="5 3" />
        <circle cx="100" cy="90" r="50" stroke="rgba(139, 47, 201, 0.55)" strokeWidth="1.5" />

        {/* Central Celebratory Glowing Sphere */}
        <circle cx="100" cy="90" r="38" fill="url(#celebBadgeGrad)" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" />
        
        {/* Checkmark Icon */}
        <path
          d="M 88 90 L 96 98 L 114 78"
          stroke="#120324"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Confetti Sparks */}
        <g fill="#FFA3CC">
          <circle cx="45" cy="45" r="3.5" />
          <circle cx="155" cy="40" r="4" fill="#D896FF" />
          <circle cx="35" cy="125" r="3" fill="#8B2FC9" />
          <circle cx="165" cy="130" r="3.5" fill="#FF5EAC" />
          <path d="M 100 20 L 102 26 L 108 28 L 102 30 L 100 36 L 98 30 L 92 28 L 98 26 Z" />
        </g>
      </svg>
    </div>
  );
}

// ── 4. Studio Microphone & Editorial Character Artwork (New Reference Inspired) ────────
export function HeroStudioMicCharacterArtwork({ className = '', style = {} }) {
  return (
    <div
      className={`hero-artwork-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Ambient Lighting Gradients */}
          <radialGradient id="studioGlowAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FF3385" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#120324" stopOpacity="0" />
          </radialGradient>

          {/* Character Clothes Gradients */}
          <linearGradient id="charJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA3CC" />
            <stop offset="40%" stopColor="#FF3385" />
            <stop offset="100%" stopColor="#D81B60" />
          </linearGradient>

          <linearGradient id="charSkirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#360E5E" />
            <stop offset="100%" stopColor="#1C0633" />
          </linearGradient>

          {/* Large Studio Condenser Mic Metallic Gradients */}
          <linearGradient id="studioMicMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4BEE4" />
            <stop offset="30%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#8C6EAA" />
            <stop offset="100%" stopColor="#360E5E" />
          </linearGradient>

          <linearGradient id="micGrilleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3385" />
            <stop offset="40%" stopColor="#8B2FC9" />
            <stop offset="100%" stopColor="#1C0633" />
          </linearGradient>

          {/* Standing Smartphone Gradients */}
          <linearGradient id="phoneStandingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#360E5E" />
            <stop offset="60%" stopColor="#260A42" />
            <stop offset="100%" stopColor="#150428" />
          </linearGradient>

          <linearGradient id="phoneBorderGlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D896FF" />
            <stop offset="50%" stopColor="#FF3385" />
            <stop offset="100%" stopColor="#4A1570" />
          </linearGradient>

          {/* Floating Acoustic Soundwaves */}
          <linearGradient id="acousticWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4081" stopOpacity="0.1" />
            <stop offset="35%" stopColor="#FF4081" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#8B2FC9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D896FF" stopOpacity="0.1" />
          </linearGradient>

          <filter id="studioShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#000000" floodOpacity="0.75" />
          </filter>

          <filter id="micGlowShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#FF3385" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* ── Layer 1: Ambient Glowing Backdrop Aura ── */}
        <circle cx="270" cy="250" r="230" fill="url(#studioGlowAura)" filter="url(#blurAura)" />

        {/* ── Layer 2: Organic Ambient Sound Wave Ribbons ── */}
        <g opacity="0.85">
          <path
            d="M 20 280 C 120 180, 200 360, 300 240 C 400 120, 460 320, 530 220"
            stroke="url(#acousticWaveGrad)"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 40 340 C 140 240, 240 420, 340 300 C 420 180, 480 360, 535 290"
            stroke="rgba(216, 150, 255, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="6 4"
            fill="none"
          />
        </g>

        {/* ── Layer 3: Large Smartphone Interface (Right Center) ── */}
        <g transform="translate(230, 40) rotate(3, 130, 200)" filter="url(#studioShadow)">
          {/* Outer Phone Bezel */}
          <rect
            x="0"
            y="0"
            width="250"
            height="400"
            rx="44"
            fill="url(#phoneStandingGrad)"
            stroke="url(#phoneBorderGlowGrad)"
            strokeWidth="2.5"
          />

          {/* Inner Screen */}
          <rect
            x="10"
            y="10"
            width="230"
            height="380"
            rx="36"
            fill="#1E0638"
            stroke="rgba(74, 21, 112, 0.9)"
            strokeWidth="1.5"
          />

          {/* Top Speaker Dot */}
          <circle cx="125" cy="24" r="3.5" fill="#4A1570" />

          {/* Top Status Header */}
          <g transform="translate(24, 46)">
            <circle cx="6" cy="6" r="4" fill="#00F5D4" />
            <text x="18" y="10" fill="#D4BEE4" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">
              HD SPATIAL AUDIO
            </text>
          </g>

          {/* Center Prominent Waveform Spectrogram */}
          <g transform="translate(25, 90)">
            <text x="100" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800" letterSpacing="0.04em" fontFamily="sans-serif">
              HOW CAN I HELP YOU?
            </text>

            {/* Spectrogram Waves */}
            <g transform="translate(10, 45)">
              <rect x="0" y="18" width="4" height="24" rx="2" fill="#FF4081" />
              <rect x="9" y="8" width="4" height="44" rx="2" fill="#FFA3CC" />
              <rect x="18" y="0" width="4" height="60" rx="2" fill="#FFFFFF" />
              <rect x="27" y="12" width="4" height="36" rx="2" fill="#D896FF" />
              <rect x="36" y="4" width="4" height="52" rx="2" fill="#FF3385" />
              <rect x="45" y="16" width="4" height="28" rx="2" fill="#8B2FC9" />
              <rect x="54" y="2" width="4" height="56" rx="2" fill="#FFFFFF" />
              <rect x="63" y="10" width="4" height="40" rx="2" fill="#FFA3CC" />
              <rect x="72" y="20" width="4" height="20" rx="2" fill="#FF4081" />
              <rect x="81" y="6" width="4" height="48" rx="2" fill="#FFFFFF" />
              <rect x="90" y="0" width="4" height="60" rx="2" fill="#D896FF" />
              <rect x="99" y="14" width="4" height="32" rx="2" fill="#8B2FC9" />
              <rect x="108" y="4" width="4" height="52" rx="2" fill="#FF3385" />
              <rect x="117" y="18" width="4" height="24" rx="2" fill="#FFA3CC" />
              <rect x="126" y="8" width="4" height="44" rx="2" fill="#FFFFFF" />
              <rect x="135" y="2" width="4" height="56" rx="2" fill="#FF4081" />
              <rect x="144" y="16" width="4" height="28" rx="2" fill="#D896FF" />
              <rect x="153" y="10" width="4" height="40" rx="2" fill="#8B2FC9" />
              <rect x="162" y="22" width="4" height="16" rx="2" fill="#FF3385" />
            </g>
          </g>

          {/* Central Large Microphone Button Icon */}
          <g transform="translate(125, 275)">
            <circle cx="0" cy="0" r="34" fill="rgba(255, 51, 133, 0.2)" stroke="#FF3385" strokeWidth="2" />
            <circle cx="0" cy="0" r="26" fill="url(#charJacketGrad)" />
            <g transform="translate(-11, -11) scale(0.9)" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <rect x="8" y="2" width="8" height="13" rx="4" fill="#FFFFFF" />
              <path d="M4 10 C4 15.5, 20 15.5, 20 10" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </g>
          </g>

          {/* Bottom Refresh / Sync Loop Icon */}
          <g transform="translate(125, 345)" stroke="#D4BEE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M -8 -4 A 9 9 0 0 1 8 -4 L 8 -1 M 8 -4 L 5 -7" />
            <path d="M 8 4 A 9 9 0 0 1 -8 4 L -8 1 M -8 4 L -5 7" />
          </g>
        </g>

        {/* ── Layer 4: Large Classic Studio Condenser Microphone & Stand ── */}
        <g transform="translate(240, 210)" filter="url(#micGlowShadow)">
          {/* Base Stand */}
          <ellipse cx="0" cy="180" rx="42" ry="14" fill="url(#studioMicMetal)" stroke="#FFFFFF" strokeWidth="1.5" />
          <ellipse cx="0" cy="176" rx="36" ry="10" fill="#360E5E" />
          
          {/* Vertical Stand Shaft */}
          <rect x="-6" y="80" width="12" height="98" rx="4" fill="url(#studioMicMetal)" stroke="#FFFFFF" strokeWidth="1" />
          
          {/* U-Shape Mic Mount Cradle */}
          <path d="M -28 70 C -28 115, 28 115, 28 70" stroke="url(#studioMicMetal)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="-28" cy="70" r="5" fill="#FFFFFF" />
          <circle cx="28" cy="70" r="5" fill="#FFFFFF" />

          {/* Condenser Capsule Body */}
          <rect x="-20" y="-10" width="40" height="85" rx="20" fill="url(#micGrilleGrad)" stroke="#FFFFFF" strokeWidth="2" />
          
          {/* Acoustic Mesh Bands */}
          <line x1="-19" y1="18" x2="19" y2="18" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="-18" y1="36" x2="18" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="-16" y1="52" x2="16" y2="52" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Active Voice Soundwave Ripples Emitters */}
          <path d="M -35 20 C -42 35, -42 55, -35 70" stroke="#FF4081" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M -48 10 C -58 35, -58 75, -48 90" stroke="#FFA3CC" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M -60 0 C -74 35, -74 95, -60 110" stroke="rgba(216,150,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>

        {/* ── Layer 5: Modern Editorial Character (Left Foreground) ── */}
        <g transform="translate(60, 230)" filter="url(#studioShadow)">
          {/* Head & Blonde Ponytail */}
          <circle cx="65" cy="50" r="18" fill="#FCEADE" />
          <path d="M 52 48 C 50 30, 80 26, 78 48 C 76 58, 68 62, 54 60 Z" fill="#F4D35E" />
          {/* Ponytail extension */}
          <path d="M 50 44 C 40 46, 36 60, 34 72 C 40 70, 48 64, 52 54 Z" fill="#EE964B" />

          {/* Neck */}
          <rect x="62" y="66" width="8" height="12" fill="#FCEADE" />

          {/* Stylish Magenta-Pink Fitted Blazer */}
          <path d="M 44 140 L 48 78 C 54 74, 76 74, 82 78 L 86 140 Z" fill="url(#charJacketGrad)" />
          {/* Collar Lapels */}
          <path d="M 58 78 L 65 104 L 72 78 Z" fill="#FFFFFF" opacity="0.9" />

          {/* Reaching Right Arm (Touching Studio Microphone) */}
          <path d="M 80 88 C 105 92, 130 96, 155 100" stroke="url(#charJacketGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
          {/* Hand Touching Mic */}
          <circle cx="158" cy="101" r="6" fill="#FCEADE" />

          {/* Left Arm by side */}
          <path d="M 50 88 C 45 105, 46 120, 48 135" stroke="url(#charJacketGrad)" strokeWidth="9" strokeLinecap="round" fill="none" />

          {/* Navy / Royal Violet Pencil Skirt */}
          <path d="M 48 140 L 82 140 L 78 200 L 52 200 Z" fill="url(#charSkirtGrad)" />

          {/* Slender Legs */}
          <rect x="56" y="200" width="7" height="60" fill="#FCEADE" />
          <rect x="71" y="200" width="7" height="60" fill="#FCEADE" />

          {/* High-Heel Shoes */}
          <path d="M 54 260 L 65 260 L 63 268 L 54 268 Z" fill="#1C0633" />
          <path d="M 69 260 L 80 260 L 78 268 L 69 268 Z" fill="#1C0633" />
        </g>

        {/* ── Layer 6: Floating Musical Acoustic Notes & Sparks ── */}
        <g fill="#FFA3CC" opacity="0.9">
          {/* Musical Note 1 */}
          <g transform="translate(460, 110) scale(1.1)">
            <circle cx="6" cy="18" r="4" fill="#FF4081" />
            <circle cx="20" cy="14" r="4" fill="#FF4081" />
            <rect x="8" y="2" width="2.5" height="16" fill="#FF4081" />
            <rect x="22" y="-2" width="2.5" height="16" fill="#FF4081" />
            <polygon points="8,2 24,-2 24,3 8,7" fill="#FF4081" />
          </g>

          {/* Musical Note 2 */}
          <g transform="translate(490, 190) scale(0.95)">
            <circle cx="6" cy="16" r="3.5" fill="#D896FF" />
            <rect x="8" y="2" width="2" height="14" fill="#D896FF" />
            <path d="M 10 2 C 16 0, 18 8, 20 10" stroke="#D896FF" strokeWidth="2" fill="none" />
          </g>

          {/* Sparkles */}
          <path d="M 120 70 L 123 78 L 131 81 L 123 84 L 120 92 L 117 84 L 109 81 L 117 78 Z" fill="#FF5EAC" />
          <circle cx="85" cy="180" r="3" fill="#D896FF" />
          <circle cx="430" cy="320" r="3.5" fill="#FF3385" />
          <circle cx="190" cy="460" r="2.5" fill="#FFA3CC" />
        </g>
      </svg>
    </div>
  );
}

