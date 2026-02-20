// Pixabay API client
// Base URL: https://pixabay.com/api/
// User must provide their own API key

const BASE_URL = 'https://pixabay.com/api';

export interface PixabayVideoHit {
  id: number;
  pageURL: string;
  videos: {
    large: { url: string; width: number; height: number; duration: number };
    medium?: { url: string; width: number; height: number; duration: number };
    small?: { url: string; width: number; height: number; duration: number };
    tiny?: { url: string; width: number; height: number; duration: number };
  };
  user: string; // attribution required
  tags: string;
}

export interface PixabaySearchResponse {
  total: number;
  hits: PixabayVideoHit[];
}

/**
 * Search for videos on Pixabay.
 * GET /videos/?key={KEY}&q={keyword}&per_page=20
 */
export async function searchVideos(
  apiKey: string,
  keyword: string,
  perPage: number = 20
): Promise<PixabaySearchResponse> {
  const url = `${BASE_URL}/videos/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(keyword)}&per_page=${perPage}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper to extract best video URL based on desired quality.
 * Prefer 'large' if available, else 'medium', else 'small'.
 */
export function getBestVideoUrl(hit: PixabayVideoHit): string {
  if (hit.videos.large) return hit.videos.large.url;
  if (hit.videos.medium) return hit.videos.medium.url;
  if (hit.videos.small) return hit.videos.small.url;
  if (hit.videos.tiny) return hit.videos.tiny.url;
  throw new Error('No video URL available for this hit');
}

/**
 * Extract attribution string for a video hit.
 * Typically: "Video by {user} on Pixabay"
 */
export function getAttribution(hit: PixabayVideoHit): string {
  return `Video by ${hit.user} on Pixabay`;
}
