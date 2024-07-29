import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('concurrent-operations-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Concurrent Operations', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Concurrent Operations tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle concurrent updates to last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;
    const baseDate = new Date('2023-06-15T10:00:00.000Z');

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map((_, index) => {
        const date = new Date(baseDate.getTime() + index * 1000);
        return updateLastUpdatedDate(mockSet, identifier, storeName, date);
      });

    await Promise.all(updatePromises);

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date after concurrent updates: ${retrievedDate.toISOString()}`);

    expect(retrievedDate.getTime()).toBe(baseDate.getTime() + (concurrentOperations - 1) * 1000);
  });

  it('should handle concurrent updates to last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;
    const baseDate = new Date('2023-06-16T10:00:00.000Z');

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map((_, index) => {
        const date = new Date(baseDate.getTime() + index * 1000);
        return updateLastAccessedDate(mockSet, identifier, storeName, date);
      });

    await Promise.all(updatePromises);

    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date after concurrent updates: ${retrievedDate.toISOString()}`);

    expect(retrievedDate.getTime()).toBe(baseDate.getTime() + (concurrentOperations - 1) * 1000);
  });

  it('should handle concurrent updates to both dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;
    const baseDate = new Date('2023-06-17T10:00:00.000Z');

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map((_, index) => {
        const date = new Date(baseDate.getTime() + index * 1000);
        return updateLastDates(mockSet, identifier, storeName, {
          lastUpdatedDate: date,
          lastAccessedDate: date,
        });
      });

    await Promise.all(updatePromises);

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved last updated date after concurrent updates: ${retrievedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after concurrent updates: ${retrievedDates.lastAccessedDate.toISOString()}`,
    );

    expect(retrievedDates.lastUpdatedDate.getTime()).toBe(
      baseDate.getTime() + (concurrentOperations - 1) * 1000,
    );
    expect(retrievedDates.lastAccessedDate.getTime()).toBe(
      baseDate.getTime() + (concurrentOperations - 1) * 1000,
    );
  });

  it('should handle concurrent operations on multiple identifiers', async () => {
    const storeName = 'testStore';
    const concurrentOperations = 50;
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];
    const baseDate = new Date('2023-06-18T10:00:00.000Z');

    const updatePromises = identifiers.flatMap((identifier) =>
      Array(concurrentOperations)
        .fill(null)
        .map((_, index) => {
          const date = new Date(baseDate.getTime() + index * 1000);
          return updateLastDates(mockSet, identifier, storeName, {
            lastUpdatedDate: date,
            lastAccessedDate: date,
          });
        }),
    );

    await Promise.all(updatePromises);

    const retrievalPromises = identifiers.map((identifier) =>
      getLastDates(mockGet, identifier, storeName),
    );
    const results = await Promise.all(retrievalPromises);

    results.forEach((result, index) => {
      log(`Retrieved dates for identifier ${identifiers[index]}:`);
      log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
      log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
      expect(result.lastUpdatedDate.getTime()).toBe(
        baseDate.getTime() + (concurrentOperations - 1) * 1000,
      );
      expect(result.lastAccessedDate.getTime()).toBe(
        baseDate.getTime() + (concurrentOperations - 1) * 1000,
      );
    });
  });

  it('should handle concurrent operations on multiple store names', async () => {
    const identifier = 'testId';
    const concurrentOperations = 50;
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];
    const baseDate = new Date('2023-06-19T10:00:00.000Z');

    const updatePromises = storeNames.flatMap((storeName) =>
      Array(concurrentOperations)
        .fill(null)
        .map((_, index) => {
          const date = new Date(baseDate.getTime() + index * 1000);
          return updateLastDates(mockSet, identifier, storeName, {
            lastUpdatedDate: date,
            lastAccessedDate: date,
          });
        }),
    );

    await Promise.all(updatePromises);

    const retrievalPromises = storeNames.map((storeName) =>
      getLastDates(mockGet, identifier, storeName),
    );
    const results = await Promise.all(retrievalPromises);

    results.forEach((result, index) => {
      log(`Retrieved dates for store name ${storeNames[index]}:`);
      log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
      log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
      expect(result.lastUpdatedDate.getTime()).toBe(
        baseDate.getTime() + (concurrentOperations - 1) * 1000,
      );
      expect(result.lastAccessedDate.getTime()).toBe(
        baseDate.getTime() + (concurrentOperations - 1) * 1000,
      );
    });
  });

  it('should handle concurrent reads and writes', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;
    const baseDate = new Date('2023-06-20T10:00:00.000Z');

    const operations = Array(concurrentOperations)
      .fill(null)
      .map((_, index) => {
        const date = new Date(baseDate.getTime() + index * 1000);
        return index % 2 === 0
          ? updateLastUpdatedDate(mockSet, identifier, storeName, date)
          : getLastUpdatedDate(mockGet, identifier, storeName);
      });

    await Promise.all(operations);

    const finalDate = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Final retrieved last updated date: ${finalDate.toISOString()}`);
    expect(finalDate.getTime()).toBe(baseDate.getTime() + (concurrentOperations - 2) * 1000);
  });

  it('should handle rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 1000;
    const baseDate = new Date('2023-06-21T10:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date after rapid updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getTime()).toBe(baseDate.getTime() + updateCount - 1);
  });

  it('should handle concurrent updates with some updates being identical', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;
    const baseDate = new Date('2023-06-22T10:00:00.000Z');

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map((_, index) => {
        const date = new Date(baseDate.getTime() + Math.floor(index / 10) * 1000);
        return updateLastUpdatedDate(mockSet, identifier, storeName, date);
      });

    await Promise.all(updatePromises);

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(
      `Retrieved last updated date after concurrent updates with some identical: ${retrievedDate.toISOString()}`,
    );
    expect(retrievedDate.getTime()).toBe(baseDate.getTime() + 9000);
  });
});
