import React from 'react';

export default function StatCard({
  title,
  value,
  trend,
  trendType = "up", // up, neutral, warn, danger
  icon: Icon,
  iconColor = "var(--primary-600)",
  iconBg = "var(--primary-50)",
  accentColor = "var(--primary-500)",
  isLive = false
}) {
  return (
    <div className="stat-card" style={{ '--accent-bar': accentColor }}>
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stat-value">{value}</span>
          {isLive && (
            <div className="waveform-bars" title="Real-time Voice Activity">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
            </div>
          )}
        </div>
        {trend && (
          <span className={`stat-trend trend-${trendType}`}>
            {trend}
          </span>
        )}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
