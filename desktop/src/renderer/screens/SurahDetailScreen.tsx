// Surah Detail Screen — Ayah range selection
import React, { useState } from 'react';
import type { Surah } from '../../types';

interface SurahDetailScreenProps {
  surah: Surah;
  onNext: (start: number, end: number) => void;
  onBack: () => void;
}

export const SurahDetailScreen: React.FC<SurahDetailScreenProps> = ({ surah, onNext, onBack }) => {
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(Math.min(10, surah.totalAyahs));

  const handleNext = () => {
    if (startAyah >= 1 && endAyah <= surah.totalAyahs && startAyah <= endAyah) {
      onNext(startAyah, endAyah);
    }
  };

  const isValid = startAyah >= 1 && endAyah <= surah.totalAyahs && startAyah <= endAyah;

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {surah.englishName}
          </h1>
          <span className="arabic-text" style={{ fontSize: '18px' }}>{surah.arabicName}</span>
        </div>
      </div>

      {/* Surah info card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--emerald)' }}>{surah.number}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>Surah</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--emerald)' }}>{surah.totalAyahs}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>Ayahs</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginTop: '4px' }}>{surah.revelationType}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' }}>Origin</div>
          </div>
        </div>
      </div>

      {/* Range inputs */}
      <div className="section-title">Select Ayah Range</div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
              Start Ayah
            </label>
            <input
              type="number"
              min={1}
              max={surah.totalAyahs}
              value={startAyah}
              onChange={(e) => setStartAyah(parseInt(e.target.value) || 1)}
              className="input-field"
              style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px', color: 'var(--text-muted)', fontSize: '18px' }}>
            →
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
              End Ayah
            </label>
            <input
              type="number"
              min={1}
              max={surah.totalAyahs}
              value={endAyah}
              onChange={(e) => setEndAyah(parseInt(e.target.value) || 1)}
              className="input-field"
              style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Selection summary */}
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--emerald-glow)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--emerald)', fontWeight: 500 }}>
            {isValid ? `${endAyah - startAyah + 1} ayah${endAyah - startAyah > 0 ? 's' : ''} selected` : 'Invalid range'}
          </span>
        </div>
      </div>

      {startAyah > endAyah && (
        <div style={{ padding: '12px 16px', background: 'var(--ruby-soft)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--ruby)', fontSize: '14px' }}>⚠ Start must be ≤ End</span>
        </div>
      )}

      {isValid && endAyah - startAyah > 50 && (
        <div style={{ padding: '12px 16px', background: 'var(--gold-soft)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--gold)', fontSize: '14px' }}>Large range — rendering may take longer</span>
        </div>
      )}

      <button className="btn btn-primary btn-full btn-lg" onClick={handleNext} disabled={!isValid} style={{ marginTop: '8px' }}>
        Next: Select Reciter →
      </button>
    </div>
  );
};
