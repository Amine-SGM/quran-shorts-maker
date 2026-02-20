// Export Screen — render progress with animated ring
import React, { useState, useEffect, useRef } from 'react';
import type { Surah, Reciter, VideoSource, SubtitleConfig } from '../../types';

interface ExportScreenProps {
  surah: Surah;
  reciter: Reciter;
  ayahStart: number;
  ayahEnd: number;
  videoSource: VideoSource;
  subtitleConfig: SubtitleConfig;
  aspectRatio: string;
  onBack: () => void;
  onHome: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({
  surah, reciter, ayahStart, ayahEnd, videoSource, subtitleConfig, aspectRatio, onBack, onHome
}) => {
  const [status, setStatus] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [outputPath, setOutputPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw progress ring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 62;
    const lineWidth = 6;

    ctx.clearRect(0, 0, size, size);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progress arc
    if (progress > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (progress / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = status === 'done' ? '#10B981' : '#D4AF37';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }, [progress, status]);

  const handleRender = async () => {
    setStatus('rendering');
    setProgress(0);
    setErrorMsg('');

    try {
      // Listen for progress
      window.electronAPI.onRenderProgress((_jobId: string, p: number, progressStatus: string, data?: string) => {
        setProgress(Math.round(p));
        // When render completes, the data parameter contains the output file path
        if (progressStatus === 'completed' && data) {
          setOutputPath(data);
          setStatus('done');
        } else if (progressStatus === 'failed' && data) {
          setErrorMsg(data);
          setStatus('error');
        }
      });

      const result = await window.electronAPI.startRender({
        id: `render-${Date.now()}`,
        surahNumber: surah.number,
        ayahRangeStart: ayahStart,
        ayahRangeEnd: ayahEnd,
        reciterId: reciter.id,
        reciterSlug: reciter.slug || reciter.id,
        videoSource,
        subtitleConfig,
        aspectRatio: aspectRatio as '9:16' | '1:1' | '4:5' | '16:9',
        status: 'queued' as const,
        createdAt: new Date(),
      });

      // The actual completion with file path is handled in onRenderProgress above
    } catch (err: any) {
      setErrorMsg(err.message || 'Render failed');
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button className="btn btn-ghost" onClick={onBack} disabled={status === 'rendering'}>← Back</button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Export
        </h1>
      </div>

      {/* Summary card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="section-title">Render Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Surah</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{surah.englishName}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Ayahs</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{ayahStart}–{ayahEnd}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Reciter</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{reciter.name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Ratio</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{aspectRatio}</div>
          </div>
        </div>
      </div>

      {/* Progress area */}
      <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
          <canvas ref={canvasRef} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            {status === 'idle' && (
              <div style={{ fontSize: '36px', opacity: 0.3 }}>▶</div>
            )}
            {status === 'rendering' && (
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>{progress}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Rendering</div>
              </div>
            )}
            {status === 'done' && (
              <div style={{ fontSize: '36px', color: 'var(--emerald)' }}>✓</div>
            )}
            {status === 'error' && (
              <div style={{ fontSize: '36px', color: 'var(--ruby)' }}>✕</div>
            )}
          </div>
        </div>

        {status === 'idle' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Ready to render your Quran short
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleRender} style={{ padding: '16px 48px' }}>
              Start Render
            </button>
          </div>
        )}

        {status === 'rendering' && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', animation: 'progressPulse 2s ease-in-out infinite' }}>
            Processing video… Please wait
          </p>
        )}

        {status === 'done' && (
          <div>
            <p style={{ color: 'var(--emerald)', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
              Render Complete!
            </p>
            {outputPath && (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', wordBreak: 'break-all', maxWidth: '400px', margin: '0 auto 20px' }}>
                {outputPath}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {outputPath && (
                <button className="btn btn-secondary" onClick={() => window.electronAPI.showInFolder(outputPath)}>
                  📂 Open in Folder
                </button>
              )}
              <button className="btn btn-secondary" onClick={onHome}>
                New Short
              </button>
              <button className="btn btn-primary" onClick={handleRender}>
                Render Again
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p style={{ color: 'var(--ruby)', fontSize: '14px', marginBottom: '16px' }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
              <button className="btn btn-primary" onClick={handleRender}>Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
