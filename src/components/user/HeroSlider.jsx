import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '../../router';
import {
  HeroVoiceStageArtwork,
  HeroStudioMicCharacterArtwork,
  HeroFriendsVoiceSecurityArtwork
} from './UserVisuals';

/**
 * HeroSlider Component for Voice Chat & Friends
 * Strict Fixed-Frame Dimensions across all 3 slides (Zero Layout Shifts)
 * Styled using the reference-extracted color palette:
 * - Background Atmosphere: #120324 / #1C0633
 * - Hot Magenta-Pink Accent: #FF3385 / #FF4081
 * - Royal Violet & Lilac: #8B2FC9 / #D896FF
 * - Surfaces: #260A42 / #360E5E
 * - Crisp White Typography: #FFFFFF / #D4BEE4
 */

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimerRef = useRef(null);

  const slides = [
    {
      id: 'slide-discover',
      badge: 'Live Social Audio Lounge',
      badgeIcon: true,
      titlePart1: 'Talk. Connect.',
      titleHighlight: 'Make Real Voice Friends.',
      description: 'Discover live audio lounges based on your passions, jump into late-night chill talks, or build your close circle in a safe, moderated voice community.',
      primaryCta: { label: 'Get Started Free', to: '/register' },
      secondaryCta: { label: 'Sign In', to: '/login' },
      artwork: <HeroVoiceStageArtwork style={{ maxWidth: 440, maxHeight: 370 }} />
    },
    {
      id: 'slide-studio-voice',
      badge: 'HD Spatial Voice & Discovery',
      badgeIcon: false,
      badgeEmoji: '🎙️',
      titlePart1: 'Experience Pure HD Voice &',
      titleHighlight: 'Instant Topic Matchmaking.',
      description: 'Crystal-clear studio audio and intelligent matchmaking that pairs you instantly with friendly people who share your exact frequency and hobbies.',
      primaryCta: { label: 'Join Live Stage', to: '/register' },
      secondaryCta: { label: 'Explore Topics', to: '/onboarding/interests' },
      artwork: <HeroStudioMicCharacterArtwork style={{ maxWidth: 440, maxHeight: 370 }} />
    },
    {
      id: 'slide-friends-call',
      badge: 'Mutual Friends 1-on-1 Calling',
      badgeIcon: false,
      badgeEmoji: '🔒',
      titlePart1: 'Private Voice Calling With',
      titleHighlight: 'Zero Stranger Harassment.',
      description: 'Direct 1-to-1 voice calling restricted strictly to your accepted mutual friends. Complete consent controls, HD encryption, and zero unwanted spam.',
      primaryCta: { label: 'Connect With Friends', to: '/register' },
      secondaryCta: { label: 'How Safety Works', to: '/onboarding' },
      artwork: <HeroFriendsVoiceSecurityArtwork style={{ maxWidth: 440, maxHeight: 370 }} />
    }
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Continuous reliable auto-slide (4.5s interval)
  useEffect(() => {
    if (isPaused) return;

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [nextSlide, isPaused]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    }
  };

  return (
    <div
      className="hero-slider-container"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Voice Chat & Friends Feature Highlights"
    >
      {/* Fixed Dimension Viewport Frame (All 3 slides share identical bounds) */}
      <div className="hero-slider-viewport">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`hero-slide-item ${isActive ? 'active' : 'inactive'}`}
              aria-hidden={!isActive}
            >
              {/* Left Column: Text Content & Actions */}
              <div className="hero-slide-content">
                {/* Category Badge */}
                <div className="hero-slide-badge">
                  {slide.badgeIcon && (
                    <span className="voice-wave-visualizer" style={{ marginRight: 6 }}>
                      <span className="voice-wave-bar" />
                      <span className="voice-wave-bar" />
                      <span className="voice-wave-bar" />
                      <span className="voice-wave-bar" />
                      <span className="voice-wave-bar" />
                    </span>
                  )}
                  {slide.badgeEmoji && <span style={{ marginRight: 6 }}>{slide.badgeEmoji}</span>}
                  <span>{slide.badge}</span>
                </div>

                {/* Heading (Uniform line structure) */}
                <h1 className="hero-slide-title">
                  {slide.titlePart1}
                  <br />
                  <span className="hero-slide-title-gradient">
                    {slide.titleHighlight}
                  </span>
                </h1>

                {/* Subtitle / Description */}
                <p className="hero-slide-description">
                  {slide.description}
                </p>

                {/* CTAs */}
                <div className="hero-slide-cta-row">
                  <Link
                    to={slide.primaryCta.to}
                    className="btn-user-primary"
                    style={{ width: 'auto', padding: '12px 28px', fontSize: '0.96rem' }}
                  >
                    <span>{slide.primaryCta.label}</span>
                    <span style={{ fontSize: '1.14rem', marginLeft: 4 }}>&rarr;</span>
                  </Link>
                  <Link
                    to={slide.secondaryCta.to}
                    className="btn-user-secondary"
                    style={{ width: 'auto', padding: '12px 24px', fontSize: '0.94rem' }}
                  >
                    <span>{slide.secondaryCta.label}</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Visual Artwork */}
              <div className="hero-slide-visual">
                {slide.artwork}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slider Controls Bar */}
      <div className="hero-slider-controls">
        {/* Previous Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="hero-slider-nav-btn"
          aria-label="Previous Slide"
          title="Previous feature"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Slide Indicator Dots */}
        <div className="hero-slider-dots" role="tablist" aria-label="Slides">
          {slides.map((slide, index) => {
            const isActive = index === activeSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`hero-slider-dot ${isActive ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}: ${slide.titlePart1}`}
                aria-selected={isActive}
                role="tab"
              >
                <span className="hero-slider-dot-inner" />
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={nextSlide}
          className="hero-slider-nav-btn"
          aria-label="Next Slide"
          title="Next feature"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
