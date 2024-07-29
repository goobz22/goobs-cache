import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('integration-with-cache-system-server-test.log');
const log = createLogger(logStream);

// Mock cache system
class MockCache {
  private store: { [key: string]: string } = {};

  async get(key: string): Promise<string | null> {
    return this.store[key] || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }

  async delete(key: string): Promise<void> {
    delete this.store[key];
  }

  async clear(): Promise<void> {
    this.store = {};
  }
}

describe('Last Date Server Utilities - Integration with Cache System', () => {
  let mockCache: MockCache;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Integration with Cache System tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockCache = new MockCache();
  });

  afterAll(() => {
    logStream.end();
  });

  it('should update and retrieve last updated date through cache', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    await updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date from cache: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should update and retrieve last accessed date through cache', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00.000Z');

    await updateLastAccessedDate(mockCache.set.bind(mockCache), identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last accessed date from cache: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should update and retrieve both dates through cache', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T09:00:00.000Z');
    const accessedDate = new Date('2023-06-17T09:01:00.000Z');

    await updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const retrievedDates = await getLastDates(mockCache.get.bind(mockCache), identifier, storeName);

    log(`Retrieved last updated date from cache: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(
      `Retrieved last accessed date from cache: ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle cache misses', async () => {
    const identifier = 'nonExistentId';
    const storeName = 'nonExistentStore';

    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved date for cache miss: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle multiple updates to the same key in cache', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-18T11:30:00.000Z');
    const date2 = new Date('2023-06-18T11:45:00.000Z');

    await updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date1);
    await updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date2);

    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date after multiple updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date2);
  });

  it('should handle concurrent updates to cache', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-19T10:00:00.000Z');
    const date2 = new Date('2023-06-19T10:01:00.000Z');

    await Promise.all([
      updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date1),
      updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date2),
    ]);

    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date after concurrent updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getTime()).toBeGreaterThanOrEqual(date1.getTime());
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(date2.getTime());
  });

  it('should handle cache clear operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-20T12:00:00.000Z');

    await updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    await mockCache.clear();

    const retrievedDates = await getLastDates(mockCache.get.bind(mockCache), identifier, storeName);

    log(
      `Retrieved last updated date after cache clear: ${retrievedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after cache clear: ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(new Date(0));
    expect(retrievedDates.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle cache delete operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-21T13:00:00.000Z');

    await updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date);

    // Simulate cache key deletion
    await mockCache.delete(`${identifier}:${storeName}:lastUpdated`);

    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date after cache delete: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle cache errors during set operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-22T14:00:00.000Z');

    const errorCache = {
      set: jest.fn().mockRejectedValue(new Error('Cache set error')),
      get: mockCache.get.bind(mockCache),
    };

    await expect(
      updateLastUpdatedDate(errorCache.set, identifier, storeName, date),
    ).rejects.toThrow('Cache set error');
    log('Successfully caught cache set error');
  });

  it('should handle cache errors during get operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const errorCache = {
      set: mockCache.set.bind(mockCache),
      get: jest.fn().mockRejectedValue(new Error('Cache get error')),
    };

    await expect(getLastUpdatedDate(errorCache.get, identifier, storeName)).rejects.toThrow(
      'Cache get error',
    );
    log('Successfully caught cache get error');
  });

  it('should handle cache operations with large data volumes', async () => {
    const iterations = 1000;
    const baseDate = new Date('2023-06-23T00:00:00.000Z');

    for (let i = 0; i < iterations; i++) {
      const identifier = `testId${i}`;
      const storeName = `testStore${i % 10}`; // Use 10 different store names
      const date = new Date(baseDate.getTime() + i * 1000); // Increment by 1 second each iteration

      await updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    // Verify a random subset of the data
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * iterations);
      const identifier = `testId${randomIndex}`;
      const storeName = `testStore${randomIndex % 10}`;
      const expectedDate = new Date(baseDate.getTime() + randomIndex * 1000);

      const retrievedDates = await getLastDates(
        mockCache.get.bind(mockCache),
        identifier,
        storeName,
      );

      log(`Retrieved dates for ${identifier} in ${storeName}:`);
      log(`Last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
      log(`Last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);

      expect(retrievedDates.lastUpdatedDate).toEqual(expectedDate);
      expect(retrievedDates.lastAccessedDate).toEqual(expectedDate);
    }
  });

  it('should handle cache operations with very long identifiers and store names', async () => {
    const longIdentifier = 'a'.repeat(1000);
    const longStoreName = 'b'.repeat(1000);
    const date = new Date('2023-06-24T15:00:00.000Z');

    await updateLastDates(mockCache.set.bind(mockCache), longIdentifier, longStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const retrievedDates = await getLastDates(
      mockCache.get.bind(mockCache),
      longIdentifier,
      longStoreName,
    );

    log(`Retrieved dates for long identifier and store name:`);
    log(`Last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);

    expect(retrievedDates.lastUpdatedDate).toEqual(date);
    expect(retrievedDates.lastAccessedDate).toEqual(date);
  });

  it('should handle cache operations with special characters in identifiers and store names', async () => {
    const specialIdentifier = 'test!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const specialStoreName = 'store!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const date = new Date('2023-06-25T16:00:00.000Z');

    await updateLastDates(mockCache.set.bind(mockCache), specialIdentifier, specialStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const retrievedDates = await getLastDates(
      mockCache.get.bind(mockCache),
      specialIdentifier,
      specialStoreName,
    );

    log(`Retrieved dates for special characters in identifier and store name:`);
    log(`Last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);

    expect(retrievedDates.lastUpdatedDate).toEqual(date);
    expect(retrievedDates.lastAccessedDate).toEqual(date);
  });

  it('should handle cache operations with very frequent updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const iterations = 1000;
    let lastDate = new Date();

    for (let i = 0; i < iterations; i++) {
      lastDate = new Date();
      await updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, lastDate);
    }

    const retrievedDate = await getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date after frequent updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime() - 1000); // Allow 1 second tolerance
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});
