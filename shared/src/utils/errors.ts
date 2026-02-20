// Error handling utilities
// Includes retry logic with exponential backoff and user-friendly messages

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class FileError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_ERROR', details);
    this.name = 'FileError';
  }
}

export class FFmpegError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'FFMPEG_ERROR', details);
    this.name = 'FFmpegError';
  }
}

/**
 * Retry function with exponential backoff and jitter.
 * @param fn Async function to retry
 * @param maxRetries Maximum number of attempts (default 3)
 * @param baseDelay Base delay in ms (default 500)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries - 1) break;
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Map low-level errors to user-friendly messages.
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (error instanceof FileError) {
    return 'File operation failed. Please ensure you have enough storage and proper permissions.';
  }
  if (error instanceof FFmpegError) {
    return 'Video processing failed. Please check your video file and try again.';
  }
  // Generic fallback
  return error.message || 'An unexpected error occurred.';
}
