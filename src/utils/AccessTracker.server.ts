'use server';
import { AccessTrackerImplementation } from '../types';

/**
 * AccessTrackerImplementation interface defines the methods that an access tracker implementation should provide.
 * It includes methods for recording access, getting frequent keys, and getting predicted next keys.
 */
let trackerInstance: AccessTrackerImplementation | null = null;

/**
 * createAccessTrackerImplementation function creates a new instance of the AccessTrackerImplementation.
 * It uses in-memory data structures to store access counts and access patterns.
 *
 * The function initializes two Maps:
 * - accessCounts: Stores the access count for each key. The key is the cache item key, and the value is the number of times it has been accessed.
 * - accessPatterns: Stores the related keys accessed along with each key. The key is the cache item key, and the value is a Set of related keys.
 *
 * The function returns an object that implements the AccessTrackerImplementation interface, with the following methods:
 * - recordAccess: Records the access of a key and an optional related key. It increments the access count for the key and adds the related key to the access patterns Map.
 * - getFrequentKeys: Retrieves the keys that have been accessed more than the specified threshold. It filters the accessCounts Map based on the threshold and returns an array of frequent keys.
 * - getPredictedNextKeys: Retrieves the predicted next keys based on the access patterns of the given key. It returns an array of related keys from the accessPatterns Map for the given key.
 *
 * @returns An instance of the AccessTrackerImplementation.
 */
function createAccessTrackerImplementation(): AccessTrackerImplementation {
  const accessCounts: Map<string, number> = new Map();
  const accessPatterns: Map<string, Set<string>> = new Map();

  return {
    async recordAccess(key: string, relatedKey?: string): Promise<void> {
      accessCounts.set(key, (accessCounts.get(key) || 0) + 1);
      if (relatedKey) {
        if (!accessPatterns.has(key)) {
          accessPatterns.set(key, new Set());
        }
        accessPatterns.get(key)!.add(relatedKey);
      }
    },

    async getFrequentKeys(threshold: number): Promise<string[]> {
      return Array.from(accessCounts.entries())
        .filter(([, count]) => count > threshold)
        .map(([key]) => key);
    },

    async getPredictedNextKeys(key: string): Promise<string[]> {
      return Array.from(accessPatterns.get(key) || []);
    },
  };
}

/**
 * getOrCreateAccessTracker function retrieves the existing access tracker instance or creates a new one if it doesn't exist.
 * It uses the trackerInstance variable to store the singleton instance of the AccessTrackerImplementation.
 *
 * If trackerInstance is null, it means that no access tracker instance has been created yet. In this case, the function calls createAccessTrackerImplementation to create a new instance and assigns it to trackerInstance.
 *
 * If trackerInstance is not null, it means that an access tracker instance already exists. In this case, the function simply returns the existing instance.
 *
 * @returns A Promise that resolves to the AccessTrackerImplementation instance.
 */
async function getOrCreateAccessTracker(): Promise<AccessTrackerImplementation> {
  if (!trackerInstance) {
    trackerInstance = createAccessTrackerImplementation();
  }
  return trackerInstance;
}

/**
 * createAccessTracker function creates a new instance of the AccessTrackerImplementation.
 * It is an exported function that allows other modules to create an access tracker instance.
 *
 * The function simply calls getOrCreateAccessTracker to retrieve the access tracker instance and returns it.
 *
 * @returns A Promise that resolves to the AccessTrackerImplementation instance.
 */
export async function createAccessTracker(): Promise<AccessTrackerImplementation> {
  return getOrCreateAccessTracker();
}

/**
 * recordAccess function records the access of a key and an optional related key using the access tracker.
 * It is an exported function that allows other modules to record access events.
 *
 * The function calls getOrCreateAccessTracker to retrieve the access tracker instance and then calls the recordAccess method on the instance, passing the key and relatedKey arguments.
 *
 * @param key The key that was accessed.
 * @param relatedKey An optional related key that was accessed along with the main key.
 */
export async function recordAccess(key: string, relatedKey?: string): Promise<void> {
  const tracker = await getOrCreateAccessTracker();
  await tracker.recordAccess(key, relatedKey);
}

/**
 * getFrequentKeys function retrieves the keys that have been accessed more than the specified threshold using the access tracker.
 * It is an exported function that allows other modules to retrieve frequent keys.
 *
 * The function calls getOrCreateAccessTracker to retrieve the access tracker instance and then calls the getFrequentKeys method on the instance, passing the threshold argument.
 *
 * @param threshold The minimum access count threshold for a key to be considered frequent.
 * @returns A Promise that resolves to an array of frequent keys.
 */
export async function getFrequentKeys(threshold: number): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getFrequentKeys(threshold);
}

/**
 * getPredictedNextKeys function retrieves the predicted next keys based on the access patterns of the given key using the access tracker.
 * It is an exported function that allows other modules to retrieve predicted next keys.
 *
 * The function calls getOrCreateAccessTracker to retrieve the access tracker instance and then calls the getPredictedNextKeys method on the instance, passing the key argument.
 *
 * @param key The key for which to predict the next keys.
 * @returns A Promise that resolves to an array of predicted next keys.
 */
export async function getPredictedNextKeys(key: string): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getPredictedNextKeys(key);
}

export type { AccessTrackerImplementation };
