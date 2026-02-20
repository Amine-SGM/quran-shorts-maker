// Secure storage abstraction
// Provides a simple key-value store for sensitive data like API keys
// Platform-specific backends: Electron (keytar/electron-store), React Native (AsyncStorage with encryption)

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Create a mock secure storage for development (in-memory).
 * DO NOT use in production - this is a fallback until platform-specific implementations are wired.
 */
export class InMemorySecureStorage implements SecureStorage {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// The actual implementation will be provided by platform-specific modules:
// - Desktop: use electron-store or keytar
// - Mobile: use @react-native-async-storage/async-storage with encryption
