// Quran.com API client
// Base URL: https://api.quran.com/api/v2/
// No API key required for public endpoints

import { Surah, Ayah, Reciter } from '../types';

const BASE_URL = 'https://api.quran.com/api/v2';

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
  // API returns { chapters: [...] }
  return data.chapters.map((c: any): Surah => ({
    number: c.id,
    arabicName: c.name, // assuming name is Arabic? Actually Quran.com may return both; using name as Arabic field
    englishName: c.english_name,
    revelationType: c.revelation_place as "Meccan" | "Medinan",
    totalAyahs: c.number_of_ayahs,
  }));
}

/**
 * Fetch verses (Ayahs) for a specific Surah range.
 * GET /verses/by_chapter/{chapter}?language=en&range={start}-{end}
 */
export async function getVersesByChapter(
  chapter: number,
  language: string,
  range: string // e.g., "1-5"
): Promise<Ayah[]> {
  const data = await fetchJson(`${BASE_URL}/verses/by_chapter/${chapter}?language=${language}&range=${range}`);
  // data.verses: array of { id, verse_number, text_uthmani, translation: { language_name, text } }
  return data.verses.map((v: any): Ayah => ({
    surahNumber: chapter,
    number: v.verse_number,
    arabicText: v.text_uthmani,
    englishTranslation: v.translation?.text,
  }));
}

/**
 * Fetch available reciters.
 * GET /recitations?language=en
 */
export async function getReciters(language: string = 'en'): Promise<Reciter[]> {
  const data = await fetchJson(`${BASE_URL}/recitations?language=${language}`);
  // data.recitations: array of { id, name, language, style, audio_url }
  return data.recitations.map((r: any): Reciter => ({
    id: r.id.toString(),
    name: r.name,
    language: r.language,
    style: r.style,
    sampleAudioUrl: r.audio_url,
  }));
}

/**
 * Build audio CDN URL for a specific Ayah.
 * Format: https://cdn.islamic.network/quran/audio/128/{reciter_slug}/{surah:03d}{ayah:03d}.mp3
 * Note: reciter_slug should be lowercase kebab-case; mapping from reciter ID to slug may be provided separately.
 */
export function buildAudioUrl(reciterSlug: string, surah: number, ayah: number): string {
  const surahPadded = surah.toString().padStart(3, '0');
  const ayahPadded = ayah.toString().padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio/128/${reciterSlug}/${surahPadded}${ayahPadded}.mp3`;
}
