/**
 * @file ExpirationDate.server.ts
 * @description Provides utility functions for generating expiration dates for cache items.
 */

import { CacheMode } from '../types';

/**
 * Generates an expiration date for a cache item based on the specified cache mode.
 *
 * @param {CacheMode} mode The cache mode to use for generating the expiration date.
 * @returns {Date} The generated expiration date.
 */
export function getExpirationDate(mode: CacheMode): Date {
  switch (mode) {
    case 'client':
      // Client-side cache expiration date: 12 hours from the current time
      return new Date(Date.now() + 12 * 60 * 60 * 1000);
    case 'cookie':
      // Cookie expiration date: 30 days from the current time
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    case 'server':
      // Server-side cache expiration date: 7 days from the current time
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    default:
      throw new Error(`Invalid cache mode: ${mode}`);
  }
}
