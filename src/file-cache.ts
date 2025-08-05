/**
 * Shared file caching utility for all context and content scripts
 * Provides longer caching duration for better performance
 */

import { readFileSync, existsSync, statSync } from 'fs';
import * as path from 'path';

interface CacheEntry {
  content: string;
  mtime: number;
  timestamp: number;
}

// Global cache shared across all scripts
const globalFileCache = new Map<string, CacheEntry>();

// Extended cache TTL to 1 hour (3600 seconds) for optimal performance
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get file content with caching
 * @param filePath - Path to the file
 * @returns File content or null if file doesn't exist
 */
export function getCachedFileContent(filePath: string): string | null {
  try {
    // Normalize the path for cross-platform compatibility
    const normalizedPath = path.resolve(filePath);

    // Check if file exists
    if (!existsSync(normalizedPath)) {
      return null;
    }

    // Check cache first
    const now = Date.now();
    const cached = globalFileCache.get(normalizedPath);

    if (cached) {
      // Check if cache is still valid (TTL and file modification time)
      const stats = statSync(normalizedPath);
      const fileModTime = stats.mtime.getTime();

      if (now - cached.timestamp < CACHE_TTL && cached.mtime === fileModTime) {
        return cached.content;
      }
    }

    // Read file and update cache
    const content = readFileSync(normalizedPath, 'utf-8');
    const stats = statSync(normalizedPath);

    globalFileCache.set(normalizedPath, {
      content,
      mtime: stats.mtime.getTime(),
      timestamp: now
    });

    return content;

  } catch (error) {
    return null;
  }
}

/**
 * Check if a file exists (with caching for stat calls)
 * @param filePath - Path to check
 * @returns True if file exists
 */
export function cachedFileExists(filePath: string): boolean {
  try {
    const normalizedPath = path.resolve(filePath);
    return existsSync(normalizedPath);
  } catch {
    return false;
  }
}

/**
 * Clear cache for a specific file or all files
 * @param filePath - Optional specific file path to clear, if not provided clears all
 */
export function clearCache(filePath?: string): void {
  if (filePath) {
    const normalizedPath = path.resolve(filePath);
    globalFileCache.delete(normalizedPath);
  } else {
    globalFileCache.clear();
  }
}

/**
 * Get cache statistics
 * @returns Object with cache size and TTL info
 */
export function getCacheStats(): { size: number; ttl: number } {
  return {
    size: globalFileCache.size,
    ttl: CACHE_TTL
  };
}

/**
 * Clean expired cache entries
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of globalFileCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      globalFileCache.delete(key);
    }
  }
}
