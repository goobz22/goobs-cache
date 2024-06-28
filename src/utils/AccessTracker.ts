'use server';

/**
 * AccessTrackerImplementation interface defines the methods that an access tracker implementation should provide.
 * It includes methods for recording access, getting frequent keys, and getting predicted next keys.
 */
export interface AccessTrackerImplementation {
  /**
   * recordAccess method records the access of a key and an optional related key.
   * @param key The key that was accessed.
   * @param relatedKey An optional related key that was accessed along with the main key.
   */
  recordAccess(key: string, relatedKey?: string): Promise<void>;

  /**
   * getFrequentKeys method retrieves the keys that have been accessed more than the specified threshold.
   * @param threshold The minimum access count threshold for a key to be considered frequent.
   * @returns A Promise that resolves to an array of frequent keys.
   */
  getFrequentKeys(threshold: number): Promise<string[]>;

  /**
   * getPredictedNextKeys method retrieves the predicted next keys based on the access patterns of the given key.
   * @param key The key for which to predict the next keys.
   * @returns A Promise that resolves to an array of predicted next keys.
   */
  getPredictedNextKeys(key: string): Promise<string[]>;
}

let trackerInstance: AccessTrackerImplementation | null = null;

/**
 * createAccessTrackerImplementation function creates a new instance of the AccessTrackerImplementation.
 * It uses in-memory data structures to store access counts and access patterns.
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
 * @returns A Promise that resolves to the AccessTrackerImplementation instance.
 */
export async function createAccessTracker(): Promise<AccessTrackerImplementation> {
  return getOrCreateAccessTracker();
}

/**
 * recordAccess function records the access of a key and an optional related key using the access tracker.
 * @param key The key that was accessed.
 * @param relatedKey An optional related key that was accessed along with the main key.
 */
export async function recordAccess(key: string, relatedKey?: string): Promise<void> {
  const tracker = await getOrCreateAccessTracker();
  await tracker.recordAccess(key, relatedKey);
}

/**
 * getFrequentKeys function retrieves the keys that have been accessed more than the specified threshold using the access tracker.
 * @param threshold The minimum access count threshold for a key to be considered frequent.
 * @returns A Promise that resolves to an array of frequent keys.
 */
export async function getFrequentKeys(threshold: number): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getFrequentKeys(threshold);
}

/**
 * getPredictedNextKeys function retrieves the predicted next keys based on the access patterns of the given key using the access tracker.
 * @param key The key for which to predict the next keys.
 * @returns A Promise that resolves to an array of predicted next keys.
 */
export async function getPredictedNextKeys(key: string): Promise<string[]> {
  const tracker = await getOrCreateAccessTracker();
  return tracker.getPredictedNextKeys(key);
}
