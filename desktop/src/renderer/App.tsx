// App shell — dark themed with animated transitions
import React, { useState, useCallback } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SurahDetailScreen } from './screens/SurahDetailScreen';
import { ReciterScreen } from './screens/ReciterScreen';
import { VideoSourceScreen } from './screens/VideoSourceScreen';
import { SubtitleConfigScreen } from './screens/SubtitleConfigScreen';
import { ExportScreen } from './screens/ExportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { Surah, Reciter, VideoSource, SubtitleConfig } from '../types';

type Screen = 'home' | 'surahDetail' | 'reciter' | 'videoSource' | 'subtitleConfig' | 'export' | 'settings';

const STEPS: { key: Screen; label: string }[] = [
  { key: 'home', label: 'Surah' },
  { key: 'surahDetail', label: 'Ayahs' },
  { key: 'reciter', label: 'Reciter' },
  { key: 'videoSource', label: 'Video' },
  { key: 'subtitleConfig', label: 'Style' },
  { key: 'export', label: 'Export' },
];

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [ayahRange, setAyahRange] = useState<{ start: number; end: number }>({ start: 1, end: 5 });
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig | null>(null);
  const [aspectRatio, setAspectRatio] = useState('9:16');

  const currentStepIndex = STEPS.findIndex(s => s.key === currentScreen);

  const handleSelectSurah = useCallback((surah: Surah) => {
    setSelectedSurah(surah);
    setCurrentScreen('surahDetail');
  }, []);

  const handleAyahRange = useCallback((start: number, end: number) => {
    setAyahRange({ start, end });
    setCurrentScreen('reciter');
  }, []);

  const handleSelectReciter = useCallback((reciter: Reciter) => {
    setSelectedReciter(reciter);
    setCurrentScreen('videoSource');
  }, []);

  const handleSelectVideo = useCallback((source: VideoSource) => {
    setVideoSource(source);
    setCurrentScreen('subtitleConfig');
  }, []);

  const handleSubtitleConfig = useCallback((config: SubtitleConfig, ratio: string) => {
    setSubtitleConfig(config);
    setAspectRatio(ratio);
    setCurrentScreen('export');
  }, []);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #0C0F1A 0%, #111827 50%, #0C0F1A 100%)',
    }}>
      {/* ─── Top bar with step progress ─── */}
      {currentScreen !== 'settings' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '16px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            fontFamily: "'Amiri', serif",
            fontSize: '20px',
            color: 'var(--gold)',
            marginRight: '16px',
            fontWeight: 700,
          }}>
            ﷽
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {STEPS.map((step, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <React.Fragment key={step.key}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isActive ? 1 : isDone ? 0.7 : 0.3,
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: isActive ? 'var(--emerald)' : isDone ? 'var(--emerald-dim)' : 'var(--bg-surface)',
                      color: isActive || isDone ? 'white' : 'var(--text-muted)',
                      border: isActive ? 'none' : '1px solid var(--border-subtle)',
                      boxShadow: isActive ? '0 0 12px var(--emerald-glow)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      letterSpacing: '0.3px',
                    }}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '1px',
                      background: isDone ? 'var(--emerald-dim)' : 'var(--border-subtle)',
                      transition: 'background 0.3s ease',
                      minWidth: '12px',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Screen content ─── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '28px',
      }}>
        <div key={currentScreen} style={{ animation: 'slideUp 0.35s ease-out' }}>
          {currentScreen === 'home' && (
            <HomeScreen
              onSelectSurah={handleSelectSurah}
              onOpenSettings={() => setCurrentScreen('settings')}
            />
          )}
          {currentScreen === 'surahDetail' && selectedSurah && (
            <SurahDetailScreen
              surah={selectedSurah}
              onNext={handleAyahRange}
              onBack={() => setCurrentScreen('home')}
            />
          )}
          {currentScreen === 'reciter' && (
            <ReciterScreen
              onSelectReciter={handleSelectReciter}
              onBack={() => setCurrentScreen('surahDetail')}
            />
          )}
          {currentScreen === 'videoSource' && (
            <VideoSourceScreen
              onSelectVideo={handleSelectVideo}
              onBack={() => setCurrentScreen('reciter')}
            />
          )}
          {currentScreen === 'subtitleConfig' && (
            <SubtitleConfigScreen
              onNext={handleSubtitleConfig}
              onBack={() => setCurrentScreen('videoSource')}
            />
          )}
          {currentScreen === 'export' && selectedSurah && selectedReciter && videoSource && subtitleConfig && (
            <ExportScreen
              surah={selectedSurah}
              reciter={selectedReciter}
              ayahStart={ayahRange.start}
              ayahEnd={ayahRange.end}
              videoSource={videoSource}
              subtitleConfig={subtitleConfig}
              aspectRatio={aspectRatio}
              onBack={() => setCurrentScreen('subtitleConfig')}
              onHome={() => setCurrentScreen('home')}
            />
          )}
          {currentScreen === 'settings' && (
            <SettingsScreen onBack={() => setCurrentScreen('home')} />
          )}
        </div>
      </div>
    </div>
  );
};
