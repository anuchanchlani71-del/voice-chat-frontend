import React, { useState, useEffect } from 'react';
import { IconSliders, IconCheck, IconShield, IconMic, IconTag, IconPhoneCall } from '../components/common/Icons';
import { adminGetSettings, adminUpdateSettings } from '../services/adminApi';

export default function Settings() {
  const initialDefaultSettings = {
    platformName: '',
    tagline: '',
    voiceChatModel: 'Model 7: Interest-based Discovery + Friend System + 1-to-1 Voice Chat',
    maxCallDurationMinutes: 120,
    requireMicPermissionBeforeCall: true,
    allowOnlineStatusToggle: true,
    minInterestsRequired: 2,
    maxInterestsAllowed: 10,
    defaultProfileVisibility: 'Logged-in Friends Only for Voice / Public for Discovery',
    friendRequestRateLimitPerHour: 15,
    autoFlagReportThreshold: 3,
  };

  const [settings, setSettings] = useState(initialDefaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState('');

  // ── Load live settings from backend on mount ───────────────────
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    adminGetSettings()
      .then((res) => {
        if (isMounted && res && res.success && res.settings) {
          setSettings(res.settings);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorAlert(err.message || 'Failed to load platform settings from server.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Save configuration settings via PUT /admin/settings ────────
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return; // Prevent duplicate submissions

    setErrorAlert('');
    setSavedAlert(false);

    // Build payload with only the 9 editable settings fields
    const payload = {
      platformName: typeof settings.platformName === 'string' ? settings.platformName.trim() : '',
      tagline: typeof settings.tagline === 'string' ? settings.tagline.trim() : '',
      maxCallDurationMinutes: parseInt(settings.maxCallDurationMinutes, 10) || 120,
      requireMicPermissionBeforeCall: Boolean(settings.requireMicPermissionBeforeCall),
      allowOnlineStatusToggle: Boolean(settings.allowOnlineStatusToggle),
      minInterestsRequired: parseInt(settings.minInterestsRequired, 10) || 1,
      maxInterestsAllowed: parseInt(settings.maxInterestsAllowed, 10) || 10,
      friendRequestRateLimitPerHour: parseInt(settings.friendRequestRateLimitPerHour, 10) || 15,
      autoFlagReportThreshold: parseInt(settings.autoFlagReportThreshold, 10) || 3,
    };

    setIsSaving(true);
    try {
      const res = await adminUpdateSettings(payload);
      if (res && res.success && res.settings) {
        setSettings(res.settings);
        setSavedAlert(true);
        setTimeout(() => setSavedAlert(false), 3500);
      }
    } catch (err) {
      setErrorAlert(err.message || 'Failed to save configuration settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <IconSliders size={28} style={{ color: 'var(--primary-500)' }} />
            Platform &amp; Voice Settings
          </h1>
          <p className="page-desc">
            Configure Phase 1 operational parameters, voice limits, onboarding interest rules, and privacy defaults.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          <IconCheck size={16} />
          {isSaving ? 'Saving…' : 'Save Configuration'}
        </button>
      </div>

      {/* Loading feedback notification */}
      {isLoading && (
        <div style={{ padding: '10px 16px', background: 'rgba(135, 124, 169, 0.10)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color-light)', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          Loading configuration settings from server…
        </div>
      )}

      {/* Success feedback notification */}
      {savedAlert && (
        <div style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-700)', marginBottom: '20px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCheck size={16} />
          Configuration settings updated successfully.
        </div>
      )}

      {/* Error feedback notification */}
      {errorAlert && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 'var(--radius-md)', color: '#f87171', marginBottom: '20px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠</span>
          {errorAlert}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="dashboard-grid-2">
          {/* Section 1: Platform Brand & Architecture */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconMic size={18} style={{ color: 'var(--primary-500)' }} />
                <span>Product Architecture (Phase 1 MVP)</span>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="input-control"
                  value={settings.platformName || ''}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Tagline</label>
                <input
                  type="text"
                  className="input-control"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Voice-Chat Model Implementation</label>
                <input
                  type="text"
                  className="input-control"
                  value={settings.voiceChatModel || ''}
                  disabled
                  style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}
                />
                <span className="form-hint">Strictly Phase 1 MVP Scope. Group rooms &amp; stranger matching are disabled.</span>
              </div>
            </div>
          </div>

          {/* Section 2: 1-to-1 Voice Call Parameters */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconPhoneCall size={18} style={{ color: 'var(--accent-teal)' }} />
                <span>1-to-1 Voice Chat Limitations</span>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Maximum Single Call Duration (Minutes)</label>
                <input
                  type="number"
                  className="input-control"
                  value={settings.maxCallDurationMinutes ?? ''}
                  onChange={(e) => setSettings({ ...settings, maxCallDurationMinutes: parseInt(e.target.value, 10) || 0 })}
                  disabled={isSaving || isLoading}
                />
                <span className="form-hint">Auto-terminates long hanging calls to conserve server bandwidth.</span>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  id="micCheck"
                  checked={Boolean(settings.requireMicPermissionBeforeCall)}
                  onChange={(e) => setSettings({ ...settings, requireMicPermissionBeforeCall: e.target.checked })}
                  disabled={isSaving || isLoading}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="micCheck" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--slate-800)', cursor: 'pointer' }}>
                  Enforce Browser Mic Permission Pre-Flight Check
                </label>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="onlineToggle"
                  checked={Boolean(settings.allowOnlineStatusToggle)}
                  onChange={(e) => setSettings({ ...settings, allowOnlineStatusToggle: e.target.checked })}
                  disabled={isSaving || isLoading}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="onlineToggle" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--slate-800)', cursor: 'pointer' }}>
                  Allow Users to Toggle Online/Offline Presence Privacy
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Onboarding & Discovery Interest Rules */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconTag size={18} style={{ color: 'var(--primary-500)' }} />
                <span>Onboarding &amp; Interest Matching Rules</span>
              </div>
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Min Interests Required</label>
                  <input
                    type="number"
                    className="input-control"
                    value={settings.minInterestsRequired ?? ''}
                    onChange={(e) => setSettings({ ...settings, minInterestsRequired: parseInt(e.target.value, 10) || 1 })}
                    disabled={isSaving || isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Interests Allowed</label>
                  <input
                    type="number"
                    className="input-control"
                    value={settings.maxInterestsAllowed ?? ''}
                    onChange={(e) => setSettings({ ...settings, maxInterestsAllowed: parseInt(e.target.value, 10) || 10 })}
                    disabled={isSaving || isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Default Profile Visibility</label>
                <input
                  type="text"
                  className="input-control"
                  value={settings.defaultProfileVisibility || ''}
                  disabled
                  style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Safety & Rate Limits */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IconShield size={18} style={{ color: 'var(--danger-500)' }} />
                <span>Safety &amp; Rate Limiting Thresholds</span>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Hourly Friend Request Limit (Spam Guard)</label>
                <input
                  type="number"
                  className="input-control"
                  value={settings.friendRequestRateLimitPerHour ?? ''}
                  onChange={(e) => setSettings({ ...settings, friendRequestRateLimitPerHour: parseInt(e.target.value, 10) || 10 })}
                  disabled={isSaving || isLoading}
                />
                <span className="form-hint">Prevents automated spam requests to stranger profiles.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Report Threshold for Automatic Review Escalation</label>
                <input
                  type="number"
                  className="input-control"
                  value={settings.autoFlagReportThreshold ?? ''}
                  onChange={(e) => setSettings({ ...settings, autoFlagReportThreshold: parseInt(e.target.value, 10) || 3 })}
                  disabled={isSaving || isLoading}
                />
                <span className="form-hint">Number of distinct user reports required to flag an account for critical review.</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
