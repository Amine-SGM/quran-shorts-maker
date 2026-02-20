// Subtitle Configuration Screen
import React, { useState } from 'react';
import type { SubtitleConfig } from '../../types';

interface SubtitleConfigScreenProps {
  onNext: (config: SubtitleConfig, aspectRatio: string) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'subtitleConfig';
const RATIO_KEY = 'aspectRatio';

function loadSavedConfig(): SubtitleConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { }
  return { enabled: true, fontSize: 36, color: 'white', position: 'bottom', showTranslation: true, translationFontSize: 18 };
}

function loadSavedRatio(): string {
  return localStorage.getItem(RATIO_KEY) || '9:16';
}

export const SubtitleConfigScreen: React.FC<SubtitleConfigScreenProps> = ({ onNext, onBack }) => {
  const [config, setConfig] = useState<SubtitleConfig>(loadSavedConfig);
  const [aspectRatio, setAspectRatio] = useState(loadSavedRatio);

  const handleNext = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(RATIO_KEY, aspectRatio);
    onNext(config, aspectRatio);
  };

  const colors: { value: SubtitleConfig['color']; label: string; swatch: string }[] = [
    { value: 'white', label: 'White', swatch: '#ffffff' },
    { value: 'yellow', label: 'Gold', swatch: '#D4AF37' },
    { value: 'black_outline', label: 'Outlined', swatch: '#333333' },
  ];

  const positions: { value: SubtitleConfig['position']; label: string; icon: string }[] = [
    { value: 'top', label: 'Top', icon: '↑' },
    { value: 'middle', label: 'Center', icon: '⬌' },
    { value: 'bottom', label: 'Bottom', icon: '↓' },
  ];

  const aspectRatios = [
    { value: '9:16', label: '9:16', desc: 'Shorts' },
    { value: '1:1', label: '1:1', desc: 'Square' },
    { value: '4:5', label: '4:5', desc: 'Portrait' },
    { value: '16:9', label: '16:9', desc: 'Wide' },
  ];

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Subtitle Style
        </h1>
      </div>

      {/* Enable toggle */}
      <div className="toggle-wrap" style={{ marginBottom: '24px' }} onClick={() => setConfig({ ...config, enabled: !config.enabled })}>
        <div style={{
          width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
          background: config.enabled ? 'var(--emerald)' : 'var(--bg-surface-active)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%', background: 'white',
            position: 'absolute', top: '3px',
            left: config.enabled ? '23px' : '3px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </div>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Enable Subtitles</span>
      </div>

      {config.enabled && (
        <>
          {/* Font Size */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="section-title" style={{ marginBottom: 0 }}>Arabic Font Size</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--emerald)' }}>{config.fontSize}px</span>
            </div>
            <input
              type="range"
              min={24}
              max={72}
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
            />
          </div>

          {/* Color */}
          <div className="section-title">Text Color</div>
          <div className="chip-group" style={{ marginBottom: '20px' }}>
            {colors.map(c => (
              <button
                key={c.value}
                className={`chip ${config.color === c.value ? 'chip-active' : ''}`}
                onClick={() => setConfig({ ...config, color: c.value })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: c.swatch,
                  border: c.swatch === '#ffffff' ? '1px solid var(--border-hover)' : 'none',
                }} />
                {c.label}
              </button>
            ))}
          </div>

          {/* Position */}
          <div className="section-title">Position</div>
          <div className="chip-group" style={{ marginBottom: '20px' }}>
            {positions.map(p => (
              <button
                key={p.value}
                className={`chip ${config.position === p.value ? 'chip-active' : ''}`}
                onClick={() => setConfig({ ...config, position: p.value })}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Translation toggle + size */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div className="toggle-wrap" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: config.showTranslation ? '16px' : 0 }}
              onClick={() => setConfig({ ...config, showTranslation: !config.showTranslation })}>
              <div style={{
                width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
                background: config.showTranslation ? 'var(--emerald)' : 'var(--bg-surface-active)',
                transition: 'background 0.2s',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px',
                  left: config.showTranslation ? '23px' : '3px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>English Translation</span>
            </div>

            {config.showTranslation && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Translation Size</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--emerald)' }}>{config.translationFontSize}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={36}
                  value={config.translationFontSize}
                  onChange={(e) => setConfig({ ...config, translationFontSize: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Aspect Ratio */}
      <div className="section-title">Aspect Ratio</div>
      <div className="chip-group" style={{ marginBottom: '28px' }}>
        {aspectRatios.map(r => (
          <button
            key={r.value}
            className={`chip ${aspectRatio === r.value ? 'chip-active' : ''}`}
            onClick={() => setAspectRatio(r.value)}
            style={{ flexDirection: 'column', gap: '2px', padding: '14px 12px' }}
          >
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{r.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>{r.desc}</span>
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-full btn-lg" onClick={handleNext}>
        Next: Export Video →
      </button>
    </div>
  );
};
