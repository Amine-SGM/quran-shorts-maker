// Home Screen — Surah selection with dark Islamic theme
import React, { useState, useEffect } from 'react';
import type { Surah } from '../../types';

interface HomeScreenProps {
  onSelectSurah: (surah: Surah) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectSurah, onOpenSettings }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const data = await window.electronAPI.getChapters('en');
        setSurahs(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load Surahs: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSurahs();
  }, []);

  const filteredSurahs = surahs.filter(s =>
    (s.englishName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.number.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '20px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading Surahs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
        <div style={{ fontSize: '36px' }}>⚠</div>
        <p style={{ color: 'var(--ruby)', fontSize: '16px', fontWeight: 500 }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Select a Surah
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Choose a chapter to create your video</p>
        </div>
        <button className="btn btn-ghost" onClick={onOpenSettings} style={{ fontSize: '18px' }}>
          ⚙
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px', pointerEvents: 'none' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search by name or number…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Surah grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {filteredSurahs.map((surah, i) => (
          <div
            key={surah.number}
            className="glass-card glass-card-interactive"
            onClick={() => onSelectSurah(surah)}
            style={{
              padding: '18px 20px',
              cursor: 'pointer',
              animation: `slideUp 0.35s ease-out ${Math.min(i * 0.03, 0.3)}s both`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Number badge */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--emerald)',
                  background: 'var(--emerald-glow)',
                  borderRadius: '8px',
                  transform: 'rotate(45deg)',
                }}>
                  <span style={{ transform: 'rotate(-45deg)' }}>{surah.number}</span>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {surah.englishName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {surah.totalAyahs} verses · {surah.revelationType}
                  </div>
                </div>
              </div>
              <div className="arabic-text" style={{ fontSize: '20px', lineHeight: 1 }}>
                {surah.arabicName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>No Surahs matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
