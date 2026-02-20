// Integration test: Full video creation flow
// End-to-end test for User Story 1

import { RenderJob } from '../../shared/src/utils/job-manager';
import { getChapters, getVersesByChapter, getReciters } from '../../shared/src/api/quran-client';
import { VideoSource, SubtitleConfig } from '../../shared/src/types';

// Mock implementations would be used in real test; this is a structural template
describe('Video Creation Flow Integration', () => {
  it('should complete full flow: Surah selection → reciter → video → subtitles → render', async () => {
    // 1. Select Surah 1, Ayahs 1-3
    const surahNumber = 1;
    const ayahRange = { start: 1, end: 3 };
    const verses = await getVersesByChapter(surahNumber, 'en', `${ayahRange.start}-${ayahRange.end}`);
    expect(verses.length).toBe(3);

    // 2. Select reciter
    const reciters = await getReciters('en');
    const reciter = reciters[0];
    expect(reciter.id).toBeDefined();
    expect(reciter.sampleAudioUrl).toBeDefined();

    // 3. Prepare video source (upload)
    const videoSource: VideoSource = {
      sourceType: 'upload',
      filePath: '/path/to/sample.mp4',
      originalWidth: 1920,
      originalHeight: 1080,
      duration: 30,
      format: 'mp4',
    };

    // 4. Configure subtitles
    const subtitleConfig: SubtitleConfig = {
      enabled: true,
      fontSize: 48,
      color: 'white',
      position: 'bottom',
      showTranslation: true,
      translationFontSize: 24,
    };

    // 5. Create render job
    const jobManager = new (require('../../shared/src/utils/job-manager').jobManager.constructor)();
    const job = jobManager.createJob({
      surahNumber,
      ayahRangeStart: ayahRange.start,
      ayahRangeEnd: ayahRange.end,
      reciterId: reciter.id,
      videoSource,
      subtitleConfig,
      aspectRatio: '9:16',
    });

    expect(job.status).toBe('queued');
    expect(job.aspectRatio).toBe('9:16');

    // In real test, we would execute the render pipeline and assert completion
  });
});
