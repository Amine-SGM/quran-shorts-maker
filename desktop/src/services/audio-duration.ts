// Audio duration service
// Uses ffprobe to get audio file duration

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get the duration of an audio file in seconds using ffprobe
 */
export async function getAudioDuration(filePath: string, ffprobePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting audio duration:', error);
    throw new Error(`Failed to get duration for ${filePath}`);
  }
}
