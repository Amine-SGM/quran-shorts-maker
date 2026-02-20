// Pexels API client
// Base URL: https://api.pexels.com/videos
// User must provide their own API key (set via Authorization header)

const BASE_URL = 'https://api.pexels.com/videos';

export interface PexelsVideoFile {
    id: number;
    quality: string; // e.g. "hd", "sd", "uhd"
    file_type: string; // e.g. "video/mp4"
    width: number;
    height: number;
    fps: number;
    link: string;
}

export interface PexelsVideoPicture {
    id: number;
    nr: number;
    picture: string; // thumbnail URL
}

export interface PexelsVideoHit {
    id: number;
    width: number;
    height: number;
    duration: number;
    url: string; // Pexels page URL
    image: string; // preview image URL
    video_files: PexelsVideoFile[];
    video_pictures: PexelsVideoPicture[];
    user: {
        id: number;
        name: string;
        url: string;
    };
}

export interface PexelsSearchResponse {
    total_results: number;
    page: number;
    per_page: number;
    videos: PexelsVideoHit[];
    next_page?: string;
}

/**
 * Search for videos on Pexels.
 * GET /search?query={keyword}&per_page=20
 * Authorization: {API_KEY}
 */
export async function searchVideos(
    apiKey: string,
    keyword: string,
    perPage: number = 20
): Promise<PexelsSearchResponse> {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(keyword)}&per_page=${perPage}`;
    const response = await fetch(url, {
        headers: {
            Authorization: apiKey,
        },
    });
    if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Helper to extract best video URL based on desired quality.
 * Prefer HD (1080p+) first, then SD fallback.
 */
export function getBestVideoUrl(hit: PexelsVideoHit): string {
    // Sort by width descending to get the highest quality first
    const sorted = [...hit.video_files]
        .filter((f) => f.file_type === 'video/mp4')
        .sort((a, b) => b.width - a.width);

    if (sorted.length === 0) {
        throw new Error('No MP4 video file available for this hit');
    }
    return sorted[0].link;
}

/**
 * Get video URL matching a specific resolution preference.
 * Falls back to the closest available resolution.
 */
export function getVideoUrlForResolution(
    hit: PexelsVideoHit,
    targetWidth: number
): string {
    const mp4Files = hit.video_files
        .filter((f) => f.file_type === 'video/mp4')
        .sort((a, b) => Math.abs(a.width - targetWidth) - Math.abs(b.width - targetWidth));

    if (mp4Files.length === 0) {
        throw new Error('No MP4 video file available for this hit');
    }
    return mp4Files[0].link;
}

/**
 * Extract attribution string for a video hit.
 * Pexels requires attribution: "Video by {user} on Pexels"
 */
export function getAttribution(hit: PexelsVideoHit): string {
    return `Video by ${hit.user.name} on Pexels`;
}
