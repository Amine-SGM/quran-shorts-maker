// Video Source Screen — upload or stock video selection
import React, { useState } from 'react';
import type { VideoSource } from '../../types';

interface VideoSourceScreenProps {
  onSelectVideo: (source: VideoSource) => void;
  onBack: () => void;
}

export const VideoSourceScreen: React.FC<VideoSourceScreenProps> = ({ onSelectVideo, onBack }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'stock'>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [stockVideos] = useState([
    { id: '1', title: 'Nature Landscape', url: 'https://www.pexels.com/video/drone-footage-of-a-mountain-3571264/', thumbnail: '🌿' },
    { id: '2', title: 'Ocean Waves', url: 'https://www.pexels.com/video/waves-crashing-on-shore-1093662/', thumbnail: '🌊' },
    { id: '3', title: 'Forest Path', url: 'https://www.pexels.com/video/sunlight-through-trees-3571264/', thumbnail: '🌲' },
    { id: '4', title: 'Sunset Sky', url: 'https://www.pexels.com/video/sunset-over-the-sea-1093662/', thumbnail: '🌅' },
  ]);

  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.selectVideoFile();
      if (filePath) setSelectedFile(filePath);
    } catch (err: any) {
      console.error('File selection error:', err);
    }
  };

  const handleUploadNext = () => {
    if (selectedFile) {
      onSelectVideo({ sourceType: 'upload', filePath: selectedFile, originalWidth: 1920, originalHeight: 1080, duration: 30, format: 'mp4' });
    }
  };

  const handleStockSelect = (video: typeof stockVideos[0]) => {
    onSelectVideo({ sourceType: 'stock', stockUrl: video.url, originalWidth: 1920, originalHeight: 1080, duration: 30, format: 'mp4' });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Video Source
        </h1>
      </div>

      {/* Tab switcher */}
      <div className="chip-group" style={{ marginBottom: '24px' }}>
        <button className={`chip ${activeTab === 'upload' ? 'chip-active' : ''}`} onClick={() => setActiveTab('upload')}>
          📁 Upload Video
        </button>
        <button className={`chip ${activeTab === 'stock' ? 'chip-active' : ''}`} onClick={() => setActiveTab('stock')}>
          🎬 Stock Videos
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div>
          {/* Drop zone */}
          <div
            className="glass-card"
            onClick={handleFileSelect}
            style={{
              padding: '56px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              border: selectedFile ? '1px solid var(--emerald)' : '2px dashed var(--border-hover)',
              background: selectedFile ? 'var(--emerald-glow)' : 'var(--bg-surface)',
              transition: 'all 0.3s',
            }}
          >
            {selectedFile ? (
              <div>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
                <p style={{ fontWeight: 600, color: 'var(--emerald)', marginBottom: '6px', fontSize: '15px' }}>Video Selected</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', wordBreak: 'break-all', maxWidth: '400px', margin: '0 auto' }}>
                  {selectedFile}
                </p>
                <button className="btn btn-secondary" style={{ marginTop: '16px' }}>Change File</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>📁</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '4px' }}>Click to select a video file</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>MP4, MOV, or AVI</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <button className="btn btn-primary btn-full btn-lg" onClick={handleUploadNext} style={{ marginTop: '20px' }}>
              Next: Configure Subtitles →
            </button>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Search stock videos…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ marginBottom: '20px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {stockVideos
              .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((video, i) => (
                <div
                  key={video.id}
                  className="glass-card glass-card-interactive"
                  onClick={() => handleStockSelect(video)}
                  onMouseEnter={() => setHoveredId(video.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '28px 16px',
                    textAlign: 'center',
                    animation: `slideUp 0.3s ease-out ${i * 0.05}s both`,
                    borderColor: hoveredId === video.id ? 'var(--emerald)' : undefined,
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>{video.thumbnail}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{video.title}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
