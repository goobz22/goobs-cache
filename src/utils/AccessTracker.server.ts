/**
 * @file AccessTracker.ts
 * @description Implements an access tracker for caching systems to monitor and predict key access patterns.
 */

'use server';
import { AccessTrackerImplementation } from '../types';

/**
 * Singleton instance of the AccessTrackerImplementation.
 * @type {AccessTrackerImplementation | null}
 */
let trackerInstance: AccessTrackerImplementation | null = null;

/**
 * Creates a new instance of the AccessTrackerImplementation.
 * Uses in-memory data structures to store access counts and access patterns.
 *
 * @returns {AccessTrackerImplementation} An instance of the AccessTrackerImplementation.
 */
function createAccessTrackerImplementation(): AccessTrackerImplementation {
  const accessCounts: Map<string, number> = new Map();
  const accessPatterns: Map<string, Set<string>> = new Map();

  return {
    /**
     * Records the access of a key and an optional related key.
     *
     * @param {string} key - The key that was accessed.
     * @param {string} [relatedKey] - An optional related key that was accessed along with the main key.
     * @returns {Promise<void>}
     */
    async recordAccess(key: string, relatedKey?: string): Promise<void> {
      accessCounts.set(key, (accessCounts.get(key) || 0) + 1);
      if (relatedKey) {
        if (!accessPatterns.has(key)) {
          accessPatterns.set(key, new Set());
        }
        accessPatterns.get(key)!.add(relatedKey);
      }
    },

    /**
     * Retrieves the keys that have been accessed more than the specified threshold.
     *
     * @param {number} threshold - The minimum access count for a key to be considered frequent.
     * @returns {Promise<string[]>} An array of frequent keys.
     */
    async getFrequentKeys(threshold: number): Promise<string[]> {
      return Array.from(accessCounts.entries())
        .filter(([, count]) => count > threshold)
        .map(([key]) => key);
    },

    /**
     * Retrieves the predicted next keys based on the access patterns of the given key.
     *
     * @param {string} key - The key for which to predict the next keys.
     * @returns {Promise<string[]>} An array of predicted next keys.
     */
    async getPredictedNextKeys(key: string): Promise<string[]> {
      return Array.from(accessPatterns.get(key) || []);
    },
  };
}

/**
 * Retrieves the existing access tracker instance or creates a new one if it doesn't exist.
 * Implements the singleton pattern for AccessTrackerImplementation.
 *
 * @returns {Promise<AccessTrackerImplementation>} A Promise that resolves to the AccessTrackerImplementation instance.
 */
async function getOrCreateAccessTracker(): Promise<AccessTrackerImplementation> {
  if (!trackerInstance) {
    trackerInstance = createAccessTrackerImplementation();
  }
  return trackerInstance;
}

/**
 * Creates a new instance of the AccessTrackerImplementation.
 * This function is exported to allow other modules to create an access tracker instance.
 *
 * @returns {Promise<AccessTrackerImplementation>} A Promise that resolves to the AccessTrackerImplementation instance.
 */
export async function createAccessTracker(): Promise<AccessTrackerImplementation> {
  return getOrCreateAccessTracker();
}

/**
 * Records the access of a key and an optional related key using the access tracker.
 * This function is exported to allow other modules to record access events.
 *
 * @param {string} key - The key that was accessed.
 * @param {string} [relatedKey] - An optional related key that was accessed along with the main key.
 * @returns {Promise<void>}
 */
export async function recordAccess(key: string, relatedKey?: string): Promise<void> {
  const tracker = await getOrCreateAccessTracker();
  await tracker.recordAccess(key, relatedKey);
}

/**
 * Retrieves the keys that have been accessed more than the specified threshold using the access tracker.
 * This function is exported to allow other modules to retrieve frequent keys.
 *
 * @param {number} threshold - The minimum access count for a key to be considered frequent.
 * @returns {Promise<string[]>} A Promise that resolves to an array of frequent keys.
 */
export async function getFrequentKeys(threshold: number): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getFrequentKeys(threshold);
}

/**
 * Retrieves the predicted next keys based on the access patterns of the given key using the access tracker.
 * This function is exported to allow other modules to retrieve predicted next keys.
 *
 * @param {string} key - The key for which to predict the next keys.
 * @returns {Promise<string[]>} A Promise that resolves to an array of predicted next keys.
 */
export async function getPredictedNextKeys(key: string): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getPredictedNextKeys(key);
}

export type { AccessTrackerImplementation };
