# Quran Short Maker - Architecture Documentation

**Version**: 1.0.0  
**Last Updated**: 2026-02-12  
**Repository**: `001-quran-short-maker` feature branch

## System Overview

Quran Short Maker is a cross-platform desktop (Electron) and mobile (React Native) application that creates short-form videos combining Quran verse audio recitation with background videos, optional Arabic/English subtitles via PNG overlay, and platform-specific quality policies. All processing occurs on-device with zero server data transmission.

### Core Value Propositions
- **Privacy-First**: All processing on-device, no data leaves user's device
- **Serverless**: Zero backend infrastructure, direct API calls to Quran.com and Pixabay only
- **Quality Preservation**: Desktop preserves exact input resolution; mobile caps at 1080p
- **Arabic Text Integrity**: Proper shaping and RTL layout using platform-native rendering

---

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Desktop   │  │Mobile    │  │Settings  │  │Export    │  │
│  │(Electron)│  │(React    │  │Screen    │  │Screen    │  │
│  │          │  │Native)   │  │          │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │        Shared Business Logic       │
        │  ┌────────┐ ┌────────┐ ┌────────┐ │
        │  │Types   │ │API     │ │Utils   │ │
        │  │Models  │ │Clients │ │Helpers │ │
        │  └────────┘ └────────┘ └────────┘ │
        └────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │      Platform-Specific Services    │
        │  ┌────────┐ ┌────────┐ ┌────────┐ │
        │  │FFmpeg  │ │Subtitle│ │Cache   │ │
        │  │Service │ │Renderer│ │Manager │ │
        │  └────────┘ └────────┘ └────────┘ │
        └────────────────────────────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │         External Resources         │
        │  ┌────────────┐  ┌────────────┐   │
        │  │Quran.com   │  │Pixabay     │   │
        │  │CDN         │  │API         │   │
        │  └────────────┘  └────────────┘   │
        └────────────────────────────────────┘
```

---

## Technology Stack

### Desktop (Electron)
- **Framework**: Electron 28.x with React 18.x
- **Language**: TypeScript 5.x
- **UI**: React components with CSS modules
- **Canvas**: Node.js canvas (Cairo backend) for Arabic text rendering
- **FFmpeg**: Native binaries (ffmpeg, ffprobe) ~30MB
- **Storage**: electron-store / keytar for secure API keys
- **Testing**: Jest + React Testing Library

### Mobile (React Native)
- **Framework**: React Native 0.73.x
- **Language**: TypeScript 5.x
- **UI**: React Native components with StyleSheet
- **Canvas**: Native modules (iOS CoreText, Android Canvas)
- **FFmpeg**: ffmpeg-kit-react-native-https (~25MB)
- **Storage**: @react-native-async-storage/async-storage with encryption
- **Testing**: Jest + Detox for E2E

### Shared
- **Language**: TypeScript 5.x
- **HTTP**: Native fetch / undici
- **State**: In-memory Map for job management
- **Utils**: Custom utilities for path manipulation, error handling

---

## Data Flow

### 1. Surah/Ayah Discovery Flow
```
User opens app
    ↓
HomeScreen loads
    ↓
quran-client.getChapters() → Quran.com API
    ↓
Cache response locally (offline support)
    ↓
Display grid of 114 Surahs
    ↓
User searches/filters
    ↓
Select Surah → SurahDetailScreen
    ↓
quran-client.getVersesByChapter() → Quran.com API
    ↓
Display Ayah list with Arabic + English
    ↓
User selects Ayah range
```

### 2. Video Creation Flow
```
User selects Surah/Ayah range
    ↓
Select reciter from list
    ↓
Pre-fetch audio files (parallel download)
    ↓
Cache to temp directory (3hr TTL)
    ↓
Upload video or search Pixabay
    ↓
Configure subtitles (font, color, position)
    ↓
Select aspect ratio (9:16, 1:1, 4:5, 16:9)
    ↓
Click Export → Create RenderJob
    ↓
FFmpeg command generation
    ↓
Audio concatenation
    ↓
Subtitle PNG generation (platform-specific)
    ↓
Video processing with overlay
    ↓
Quality enforcement (Fast=720p, Original=platform policy)
    ↓
Save to ~/QuranShorts/ (desktop) or camera roll (mobile)
    ↓
Show success modal with share options
```

### 3. Cache Management Flow
```
App startup
    ↓
Scan cache directory
    ↓
Delete files older than 3 hours
    ↓
Clear in-memory cache
    ↓
Normal operation
    ↓
Manual "Clear Cache" button (Settings)
    ↓
Delete all temp files immediately
```

---

## Key Components

### API Clients

#### Quran.com Client (`shared/src/api/quran-client.ts`)
```typescript
getChapters(language: string): Promise<Surah[]>
getVersesByChapter(chapter: number, language: string, range: string): Promise<Ayah[]>
getReciters(language: string): Promise<Reciter[]>
buildAudioUrl(reciterSlug: string, surah: number, ayah: number): string
```

#### Pixabay Client (`shared/src/api/pixabay-client.ts`)
```typescript
searchVideos(apiKey: string, keyword: string, perPage: number): Promise<PixabaySearchResponse>
getBestVideoUrl(hit: PixabayVideoHit): string
getAttribution(hit: PixabayVideoHit): string
```

### Core Services

#### Audio Cache (`shared/src/utils/audio-cache.ts`)
- **Purpose**: Cache downloaded Quran audio files
- **TTL**: 3 hours
- **Key**: `${reciterId}:${surah}:${ayah}`
- **Path**: `{cacheDir}/{reciterId}/{surah}{ayah}.mp3`

#### Video Cache (`shared/src/utils/video-cache.ts`)
- **Purpose**: Cache downloaded stock videos from Pixabay
- **TTL**: 3 hours
- **Storage**: Filename derived from URL

#### FFmpeg Builder (`shared/src/utils/ffmpeg-builder.ts`)
- **Aspect Ratio Filter**: Scale + pad (black bars) to maintain content
- **Quality Presets**:
  - Fast: CRF 23, preset veryfast, 720p max
  - Original: CRF 18, preset fast, platform policy enforcement
- **Commands**:
  - `buildSimpleMergeCommand`: No subtitles, audio + video copy
  - `buildSubtitleMergeCommand`: Re-encode with PNG overlay

#### Job Manager (`shared/src/utils/job-manager.ts`)
- **State Machine**: queued → processing → completed/failed
- **Storage**: In-memory Map (no persistence across restarts)
- **Transitions**: Validated, timestamps tracked

### Platform-Specific Services

#### Desktop Services

##### Subtitle Renderer (`desktop/src/services/subtitle-renderer.ts`)
- **Technology**: Node.js canvas (Cairo)
- **Features**: Arabic shaping, RTL layout, custom fonts
- **Output**: PNG files per Ayah with timing metadata

##### FFmpeg Service (`desktop/src/services/ffmpeg-service.ts`)
- **Binary Path**: `desktop/bin/ffmpeg`
- **Execution**: Child process spawn
- **Progress**: Parse stderr for frame/timestamp info

##### Audio Duration (`desktop/src/services/audio-duration.ts`)
- **Tool**: ffprobe
- **Output**: Duration in seconds

#### Mobile Services

##### Native Subtitle Renderer
- **iOS**: `SubtitleRenderer.m` using CoreText
- **Android**: `SubtitleRendererModule.java` using android.graphics.Canvas
- **Wrapper**: `mobile/src/services/subtitleRenderer.ts`

##### FFmpeg Service (`mobile/src/services/ffmpeg-service.ts`)
- **Library**: ffmpeg-kit-react-native-https
- **Execution**: Async/await wrapper
- **Progress**: Callback-based

##### Audio Duration (`mobile/src/services/audio-duration.ts`)
- **Tool**: ffmpeg-kit probe

---

## Data Model

### Core Entities

```typescript
interface Surah {
  number: number;           // 1-114
  arabicName: string;       // "الفاتحة"
  englishName: string;      // "Al-Fatiha"
  revelationType: "Meccan" | "Medinan";
  totalAyahs: number;
}

interface Ayah {
  surahNumber: number;
  number: number;           // Within Surah
  arabicText: string;       // With diacritics
  englishTranslation?: string;
  duration?: number;        // From ffprobe
}

interface Reciter {
  id: string;
  name: string;
  language: string;
  style?: string;
  sampleAudioUrl: string;
}

interface VideoSource {
  sourceType: "upload" | "stock";
  filePath?: string;
  stockUrl?: string;
  originalWidth: number;
  originalHeight: number;
  duration: number;
  format: string;
}

interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;         // 24-72
  color: "white" | "yellow" | "black_outline";
  position: "top" | "middle" | "bottom";
  showTranslation: boolean;
  translationFontSize: number; // 12-36
}

interface RenderJob {
  id: string;               // UUID
  status: "queued" | "processing" | "completed" | "failed";
  surahNumber: number;
  ayahRangeStart: number;
  ayahRangeEnd: number;
  reciterId: string;
  videoSource: VideoSource;
  subtitleConfig: SubtitleConfig;
  aspectRatio: "9:16" | "1:1" | "4:5" | "16:9";
  outputFilePath?: string;
  processingTime?: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

---

## Platform Differences

### Arabic Text Rendering
- **Desktop**: Node.js canvas with HarfBuzz (via Cairo) - proper shaping
- **Mobile**: Native modules (CoreText/Android Canvas) - proper shaping
- **Fallback**: Pre-rendered glyph arrays (if native fails)

### File System
- **Desktop**: Node.js fs module, paths: `~/QuranShorts/`
- **Mobile**: RNFS, paths: Camera roll + app documents

### Storage
- **Desktop**: electron-store (encrypted) / keytar (keychain)
- **Mobile**: AsyncStorage with encryption

### FFmpeg
- **Desktop**: Native binaries (30MB), full feature set
- **Mobile**: ffmpeg-kit-https (25MB), overlay filter included

### Quality Policy
- **Desktop**: Preserve exact input resolution (no downscale)
- **Mobile**: Preserve if ≤1080p, downscale to 1080p if >1080p

### Aspect Ratios
- **Desktop**: 9:16, 1:1, 4:5, 16:9 (4 options)
- **Mobile**: 9:16, 1:1, 4:5 (3 options, no landscape)

---

## Security & Privacy

### Data Protection
- **API Keys**: Stored in secure storage (keychain/keystore/encrypted prefs)
- **No Transmission**: User content never leaves device
- **Temp Files**: 3-hour TTL, auto-cleanup on startup/exit

### Attribution
- **Quran.com**: Required in About screen
- **Reciters**: Listed in About screen
- **Pixabay**: User responsible for video attribution

### Compliance
- **Privacy Policy**: Required for app stores
- **Telemetry**: Opt-out available
- **GDPR/CCPA**: No personal data collected

---

## Performance Targets

### Desktop
- 5-minute video with subtitles: <180 seconds
- 5-minute video without subtitles: <60 seconds
- Target: 1080p @ 30fps

### Mobile
- 1-minute video with subtitles: <300 seconds
- 1-minute video without subtitles: <60 seconds
- Memory: <200MB during subtitle rendering
- Max: 10 Ayahs per video

### Low-End Device Baseline
- **Android**: 2GB RAM, API 26, Snapdragon 4xx
- **iOS**: iPhone SE (1st gen), iOS 12, 2GB RAM
- **Desktop**: 8GB RAM, integrated graphics, SSD

---

## Error Handling

### Retry Strategy
- **Network**: Exponential backoff, 3 attempts
- **FFmpeg**: Immediate failure with detailed error
- **Cache**: Silent cleanup of corrupted files

### User Messages
- Network errors: "Check internet connection"
- Disk full: "Free up storage space"
- FFmpeg: "Video processing failed, try different video"

### Crash Reporting
- **Desktop**: Sentry integration
- **Mobile**: Sentry React Native
- **Opt-out**: User-controlled

---

## Testing Strategy

### Contract Tests
- Quran.com API response validation
- Pixabay API response validation

### Integration Tests
- Full video creation flow
- Surah browsing and search
- Settings persistence
- Cache cleanup
- Export/share functionality

### Component Tests
- HomeScreen, SurahDetailScreen
- SubtitleConfig, VideoPreview
- AspectRatioPicker

### Manual QA
- Low-end devices
- All desktop platforms
- Arabic text rendering validation
- Performance benchmarks

---

## Build & Deployment

### Development Setup
```bash
# Install dependencies
cd shared && npm install
cd desktop && npm install
cd mobile && npm install

# Place FFmpeg binaries
cp ffmpeg desktop/bin/
cp ffprobe desktop/bin/

# Download font
curl -o desktop/assets/fonts/NotoSansArabic-Regular.ttf \
  https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf
```

### Build Commands
```bash
# Desktop
cd desktop && npm run build

# Mobile iOS
cd mobile && npx react-native run-ios

# Mobile Android
cd mobile && npx react-native run-android
```

### Distribution
- **Desktop**: electron-builder (Windows, macOS, Linux)
- **Mobile**: App Store, Google Play Store
- **Size**: Desktop ~60MB, Mobile ~50MB

---

## Future Enhancements

### Short Term
- [ ] Batch processing multiple videos
- [ ] Custom fonts for subtitles
- [ ] Video trimming UI
- [ ] Export presets (Instagram, TikTok, YouTube Shorts)

### Long Term
- [ ] Cloud sync for settings
- [ ] Social features (share templates)
- [ ] AI-powered video recommendations
- [ ] Web version (PWA)

---

## Contributors

This architecture document was generated as part of the Quran Short Maker implementation plan.

**Constitution**: v1.0.0  
**Last Updated**: 2026-02-12
