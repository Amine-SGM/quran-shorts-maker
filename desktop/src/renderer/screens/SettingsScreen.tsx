// Settings Screen — dark themed with toggle switches
import React, { useState } from 'react';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    pexelsApiKey: '',
    desktopResolution: '1080p',
    autoCleanup: true,
    showPreview: true,
  });

  const handleSave = () => {
    alert('Settings saved!');
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached audio and video files?')) {
      alert('Cache cleared!');
    }
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <div className="toggle-wrap" onClick={onChange}>
      <div style={{
        width: '44px', height: '24px', borderRadius: '12px', position: 'relative', flexShrink: 0,
        background: checked ? 'var(--emerald)' : 'var(--bg-surface-active)',
        transition: 'background 0.2s',
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '3px',
          left: checked ? '23px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Settings
        </h1>
      </div>

      {/* API Config */}
      <div className="section-title">API Configuration</div>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Pexels API Key
        </label>
        <input
          type="password"
          value={settings.pexelsApiKey}
          onChange={(e) => setSettings({ ...settings, pexelsApiKey: e.target.value })}
          placeholder="Enter your Pexels API key"
          className="input-field"
        />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Optional — needed for stock video search. Get a free key at{' '}
          <span
            style={{ color: 'var(--emerald)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => window.electronAPI.openExternal('https://www.pexels.com/api/')}
          >
            pexels.com/api
          </span>
        </p>
      </div>

      {/* Resolution */}
      <div className="section-title">Export Resolution</div>
      <div className="chip-group" style={{ marginBottom: '28px' }}>
        {['720p', '1080p', '2K', '4K'].map(r => (
          <button
            key={r}
            className={`chip ${settings.desktopResolution === r ? 'chip-active' : ''}`}
            onClick={() => setSettings({ ...settings, desktopResolution: r })}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Preferences */}
      <div className="section-title">Preferences</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        <Toggle
          checked={settings.autoCleanup}
          onChange={() => setSettings({ ...settings, autoCleanup: !settings.autoCleanup })}
          label="Auto-cleanup cache after 3 hours"
        />
        <Toggle
          checked={settings.showPreview}
          onChange={() => setSettings({ ...settings, showPreview: !settings.showPreview })}
          label="Show video preview during configuration"
        />
      </div>

      {/* Cache */}
      <div className="section-title">Cache Management</div>
      <button className="btn btn-danger btn-full" onClick={handleClearCache} style={{ marginBottom: '24px' }}>
        🗑 Clear Cache
      </button>

      {/* Save */}
      <button className="btn btn-primary btn-full btn-lg" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};
