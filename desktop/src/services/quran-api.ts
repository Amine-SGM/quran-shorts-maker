// Quran.com API client for main process
// Uses native fetch (Node 18+)

import { Surah, Ayah, Reciter } from '../types';

const BASE_URL = 'https://api.quran.com/api/v4';

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Quran.com API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch all Surahs (chapters) with basic metadata.
 * GET /chapters?language=en
 */
export async function getChapters(language: string = 'en'): Promise<Surah[]> {
  const data = await fetchJson(`${BASE_URL}/chapters?language=${language}`);
  return data.chapters.map((c: any): Surah => ({
    number: c.id,
    arabicName: c.name_arabic || c.name_simple || '',
    englishName: c.translated_name?.name || c.name_simple || '',
    revelationType: c.revelation_place === 'madinah' ? 'Medinan' : 'Meccan',
    totalAyahs: c.verses_count || 0,
  }));
}

/**
 * Fetch verses (Ayahs) for a specific Surah.
 * GET /verses/by_chapter/{chapter}?language=en&fields=text_uthmani&translations=20&per_page=286
 */
export async function getVersesByChapter(
  chapter: number,
  language: string,
  range: string // e.g., "1-5"
): Promise<Ayah[]> {
  // Parse range to determine per_page
  const [start, end] = range.split('-').map(Number);
  const perPage = Math.max(end - start + 1, 50); // fetch enough verses

  // fields=text_uthmani to get Arabic text, translations=20 for Saheeh International English
  const data = await fetchJson(`${BASE_URL}/verses/by_chapter/${chapter}?language=${language}&fields=text_uthmani&translations=20&per_page=${perPage}`);

  return data.verses
    .filter((v: any) => v.verse_number >= start && v.verse_number <= end)
    .map((v: any): Ayah => ({
      surahNumber: chapter,
      number: v.verse_number,
      arabicText: v.text_uthmani || '',
      englishTranslation: (v.translations?.[0]?.text || '').replace(/<[^>]*>/g, ''), // Strip HTML tags
    }));
}

/**
 * Fetch available reciters.
 * GET /resources/recitations
 */
export async function getReciters(language: string = 'en'): Promise<Reciter[]> {
  const data = await fetchJson(`${BASE_URL}/resources/recitations`);
  return data.recitations.map((r: any): Reciter => {
    // Use reciter_name as the primary display name.
    // Append style (e.g. "Murattal", "Mujawwad") to disambiguate duplicate reciters.
    const baseName = r.reciter_name || r.translated_name?.name || '';
    const name = r.style ? `${baseName} — ${r.style}` : baseName;
    return {
      id: r.id.toString(),
      name: name,
      language: 'Arabic',
      style: r.style || undefined,
      sampleAudioUrl: '', // Will be populated by getAudioUrlsForChapter
      slug: r.id.toString(), // Use ID as slug for simplicity
    };
  });
}

/**
 * Fetch actual audio URLs for all ayahs in a chapter for a specific reciter.
 * GET /recitations/{reciterId}/by_chapter/{chapterNumber}
 * Returns a Map of "surah:ayah" -> full CDN URL
 */
export async function getAudioUrlsForChapter(
  reciterId: string,
  chapterNumber: number
): Promise<Map<string, string>> {
  const data = await fetchJson(`${BASE_URL}/recitations/${reciterId}/by_chapter/${chapterNumber}`);
  const urlMap = new Map<string, string>();

  for (const audioFile of data.audio_files) {
    const verseKey = audioFile.verse_key; // e.g., "1:1"
    const rawUrl = audioFile.url;

    // Handle different URL formats from the API:
    // - Protocol-relative: "//mirrors.quranicaudio.com/..." → prepend "https:"
    // - Absolute: "https://..." → use as-is
    // - Relative path: "AbdulBaset/Murattal/mp3/001001.mp3" → prepend CDN base
    let fullUrl: string;
    if (rawUrl.startsWith('//')) {
      fullUrl = `https:${rawUrl}`;
    } else if (rawUrl.startsWith('http')) {
      fullUrl = rawUrl;
    } else {
      fullUrl = `https://verses.quran.com/${rawUrl}`;
    }
    urlMap.set(verseKey, fullUrl);
  }

  return urlMap;
}
