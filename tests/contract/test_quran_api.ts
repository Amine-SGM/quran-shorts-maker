// Contract test for Quran.com API client
// Validates response shapes against contracts/external-apis.md

import { getChapters, getVersesByChapter, getReciters } from '../../shared/src/api/quran-client';

describe('Quran.com API Contract', () => {
  it('getChapters returns array of Surah objects', async () => {
    const chapters = await getChapters('en');
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters[0]).toHaveProperty('number');
    expect(chapters[0]).toHaveProperty('arabicName');
    expect(chapters[0]).toHaveProperty('englishName');
    expect(chapters[0]).toHaveProperty('revelationType');
    expect(chapters[0]).toHaveProperty('totalAyahs');
  });

  it('getVersesByChapter returns array of Ayah objects', async () => {
    const verses = await getVersesByChapter(1, 'en', '1-3');
    expect(Array.isArray(verses)).toBe(true);
    expect(verses[0]).toHaveProperty('surahNumber');
    expect(verses[0]).toHaveProperty('number');
    expect(verses[0]).toHaveProperty('arabicText');
    expect(verses[0]).toHaveProperty('englishTranslation');
  });

  it('getReciters returns array of Reciter objects', async () => {
    const reciters = await getReciters('en');
    expect(Array.isArray(reciters)).toBe(true);
    expect(reciters[0]).toHaveProperty('id');
    expect(reciters[0]).toHaveProperty('name');
    expect(reciters[0]).toHaveProperty('language');
    expect(reciters[0]).toHaveProperty('sampleAudioUrl');
  });
});
