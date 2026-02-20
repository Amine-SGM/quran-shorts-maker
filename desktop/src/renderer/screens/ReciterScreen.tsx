// Reciter Screen — reciter selection with dark theme
import React, { useState, useEffect } from 'react';
import type { Reciter } from '../../types';

interface ReciterScreenProps {
  onSelectReciter: (reciter: Reciter) => void;
  onBack: () => void;
}

export const ReciterScreen: React.FC<ReciterScreenProps> = ({ onSelectReciter, onBack }) => {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const loadReciters = async () => {
      try {
        const data = await window.electronAPI.getReciters('en');
        setReciters(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load reciters: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadReciters();
  }, []);

  const filteredReciters = reciters.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '20px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading reciters…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '16px' }}>
        <p style={{ color: 'var(--ruby)' }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Select Reciter
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            {reciters.length} reciters available
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px', pointerEvents: 'none' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search reciters…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Reciter list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredReciters.map((reciter, i) => (
          <div
            key={reciter.id}
            className="glass-card glass-card-interactive"
            onClick={() => onSelectReciter(reciter)}
            onMouseEnter={() => setHoveredId(reciter.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              animation: `slideUp 0.3s ease-out ${Math.min(i * 0.03, 0.3)}s both`,
              borderColor: hoveredId === reciter.id ? 'var(--emerald)' : undefined,
              boxShadow: hoveredId === reciter.id ? '0 0 20px var(--emerald-glow)' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--emerald-glow), var(--gold-soft))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--emerald)',
              }}>
                {reciter.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {reciter.name}
                </div>
                {reciter.style && (
                  <span className="badge badge-gold" style={{ marginTop: '4px' }}>{reciter.style}</span>
                )}
              </div>
            </div>
            <div style={{
              color: hoveredId === reciter.id ? 'var(--emerald)' : 'var(--text-muted)',
              fontSize: '18px',
              transition: 'all 0.2s',
              transform: hoveredId === reciter.id ? 'translateX(4px)' : 'none',
            }}>
              →
            </div>
          </div>
        ))}
      </div>

      {filteredReciters.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No reciters matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
