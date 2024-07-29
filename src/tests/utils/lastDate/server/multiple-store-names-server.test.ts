import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-store-names-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Multiple Store Names', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Multiple Store Names tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = jest.fn(async (key: string): Promise<string | null> => mockStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    });
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle multiple store names for last updated date', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName1, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier, storeName1);
    const result2 = await getLastUpdatedDate(mockGet, identifier, storeName2);

    log(`Retrieved last updated date for storeName1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle multiple store names for last accessed date', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for storeName1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle multiple store names for both dates', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved dates for storeName1: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for storeName2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle updating one store name without affecting others', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const updatedDate = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    await updateLastUpdatedDate(mockSet, identifier, storeName1, updatedDate);

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved dates for storeName1 after update: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for storeName2 after update: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(updatedDate);
    expect(result1.lastAccessedDate).toEqual(initialDate);
    expect(result2.lastUpdatedDate).toEqual(initialDate);
    expect(result2.lastAccessedDate).toEqual(initialDate);
  });

  it('should handle a large number of store names', async () => {
    const identifier = 'testId';
    const storeCount = 1000;
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    for (let i = 0; i < storeCount; i++) {
      const storeName = `testStore${i}`;
      const date = new Date(baseDate.getTime() + i * 1000);
      await updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < storeCount; i++) {
      const storeName = `testStore${i}`;
      const expectedDate = new Date(baseDate.getTime() + i * 1000);
      const result = await getLastDates(mockGet, identifier, storeName);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }

    log(`Successfully handled ${storeCount} store names`);
  });

  it('should handle store names with special characters', async () => {
    const identifier = 'testId';
    const storeName1 = 'test!@#$%^&*()_+[]{}|;:,.<>?`~Store1';
    const storeName2 = 'test-123_456.789@example.com';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved dates for store name with special characters: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for store name with email-like format: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle very long store names', async () => {
    const identifier = 'testId';
    const storeName1 = 'a'.repeat(1000);
    const storeName2 = 'b'.repeat(1000);
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName1, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier, storeName1);
    const result2 = await getLastUpdatedDate(mockGet, identifier, storeName2);

    log(`Retrieved last updated date for very long store name 1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for very long store name 2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle store names with different cases', async () => {
    const identifier = 'testId';
    const storeName1 = 'TestStore';
    const storeName2 = 'teststore';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for store name with uppercase: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for store name with lowercase: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating multiple store names concurrently', async () => {
    const identifier = 'testId';
    const storeCount = 100;
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    const updatePromises = Array.from({ length: storeCount }, (_, i) => {
      const storeName = `testStore${i}`;
      const date = new Date(baseDate.getTime() + i * 1000);
      return updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    });

    await Promise.all(updatePromises);

    const getPromises = Array.from({ length: storeCount }, (_, i) => {
      const storeName = `testStore${i}`;
      return getLastDates(mockGet, identifier, storeName);
    });

    const results = await Promise.all(getPromises);

    results.forEach((result, i) => {
      const expectedDate = new Date(baseDate.getTime() + i * 1000);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    });

    log(`Successfully handled concurrent updates for ${storeCount} store names`);
  });

  it('should handle store names with Unicode characters', async () => {
    const identifier = 'testId';
    const storeName1 = '테스트Store1';
    const storeName2 = '測試Store2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved dates for store name with Korean characters: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for store name with Chinese characters: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle store names with empty strings', async () => {
    const identifier = 'testId';
    const storeName = '';
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date for empty string store name: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle updating and retrieving dates for multiple store names in sequence', async () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    for (let i = 0; i < storeNames.length; i++) {
      const date = new Date(baseDate.getTime() + i * 86400000); // Add i days
      await updateLastDates(mockSet, identifier, storeNames[i], {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < storeNames.length; i++) {
      const expectedDate = new Date(baseDate.getTime() + i * 86400000);
      const result = await getLastDates(mockGet, identifier, storeNames[i]);
      log(`Retrieved dates for store ${storeNames[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }
  });

  it('should handle interleaved updates of multiple store names', async () => {
    const identifier = 'testId';
    const storeNames = ['storeA', 'storeB', 'storeC'];
    const baseDate = new Date('2023-06-20T10:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      for (const storeName of storeNames) {
        const date = new Date(baseDate.getTime() + i * 3600000); // Add i hours
        if (i % 2 === 0) {
          await updateLastUpdatedDate(mockSet, identifier, storeName, date);
        } else {
          await updateLastAccessedDate(mockSet, identifier, storeName, date);
        }
      }
    }

    for (const storeName of storeNames) {
      const result = await getLastDates(mockGet, identifier, storeName);
      log(`Final dates for store ${storeName}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(new Date(baseDate.getTime() + 3600000 * 4)); // 4 hours after base
      expect(result.lastAccessedDate).toEqual(new Date(baseDate.getTime() + 3600000 * 3)); // 3 hours after base
    }
  });

  it('should maintain separate date records for each store name', async () => {
    const identifier = 'testId';
    const storeName1 = 'uniqueStore1';
    const storeName2 = 'uniqueStore2';
    const date1 = new Date('2023-06-25T15:00:00.000Z');
    const date2 = new Date('2023-06-26T16:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Dates for storeName1: ${JSON.stringify(result1)}`);
    log(`Dates for storeName2: ${JSON.stringify(result2)}`);

    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);

    // Update only storeName1
    const newDate1 = new Date('2023-06-27T17:00:00.000Z');
    await updateLastUpdatedDate(mockSet, identifier, storeName1, newDate1);

    const updatedResult1 = await getLastDates(mockGet, identifier, storeName1);
    const unchangedResult2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Updated dates for storeName1: ${JSON.stringify(updatedResult1)}`);
    log(`Unchanged dates for storeName2: ${JSON.stringify(unchangedResult2)}`);

    expect(updatedResult1.lastUpdatedDate).toEqual(newDate1);
    expect(updatedResult1.lastAccessedDate).toEqual(date1);
    expect(unchangedResult2).toEqual(result2);
  });

  it('should handle a mix of existent and non-existent store names', async () => {
    const identifier = 'testId';
    const existingStoreName = 'existingStore';
    const nonExistentStoreName = 'nonExistentStore';
    const date = new Date('2023-06-28T18:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, existingStoreName, date);

    const existingResult = await getLastDates(mockGet, identifier, existingStoreName);
    const nonExistentResult = await getLastDates(mockGet, identifier, nonExistentStoreName);

    log(`Dates for existing store: ${JSON.stringify(existingResult)}`);
    log(`Dates for non-existent store: ${JSON.stringify(nonExistentResult)}`);

    expect(existingResult.lastUpdatedDate).toEqual(date);
    expect(existingResult.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(date.getTime());
    expect(nonExistentResult.lastUpdatedDate).toEqual(new Date(0));
    expect(nonExistentResult.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle store names with varying lengths', async () => {
    const identifier = 'testId';
    const storeNames = ['s', 'st', 'sto', 'stor', 'store'];
    const baseDate = new Date('2023-06-29T10:00:00.000Z');

    for (let i = 0; i < storeNames.length; i++) {
      const date = new Date(baseDate.getTime() + i * 3600000); // Add i hours
      await updateLastDates(mockSet, identifier, storeNames[i], {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < storeNames.length; i++) {
      const expectedDate = new Date(baseDate.getTime() + i * 3600000);
      const result = await getLastDates(mockGet, identifier, storeNames[i]);
      log(`Retrieved dates for store ${storeNames[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }
  });

  it('should handle updating multiple store names with the same timestamp', async () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];
    const sharedDate = new Date('2023-06-30T12:00:00.000Z');

    await Promise.all(
      storeNames.map((storeName) =>
        updateLastDates(mockSet, identifier, storeName, {
          lastUpdatedDate: sharedDate,
          lastAccessedDate: sharedDate,
        }),
      ),
    );

    for (const storeName of storeNames) {
      const result = await getLastDates(mockGet, identifier, storeName);
      log(`Retrieved dates for store ${storeName}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(sharedDate);
      expect(result.lastAccessedDate).toEqual(sharedDate);
    }
  });

  it('should handle rapid successive updates to different store names', async () => {
    const identifier = 'testId';
    const storeNames = ['storeA', 'storeB', 'storeC'];
    const updateCount = 100;
    const baseDate = new Date('2023-07-01T10:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const storeName = storeNames[i % storeNames.length];
      const date = new Date(baseDate.getTime() + i * 1000); // Add i seconds
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    for (let i = 0; i < storeNames.length; i++) {
      const result = await getLastDates(mockGet, identifier, storeNames[i]);
      const expectedDate = new Date(
        baseDate.getTime() + (updateCount - storeNames.length + i) * 1000,
      );
      log(`Final dates for store ${storeNames[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
    }
  });

  it('should handle store names that are substrings of each other', async () => {
    const identifier = 'testId';
    const storeNames = ['store', 'store1', 'store12', 'store123'];
    const baseDate = new Date('2023-07-02T12:00:00.000Z');

    for (let i = 0; i < storeNames.length; i++) {
      const date = new Date(baseDate.getTime() + i * 3600000); // Add i hours
      await updateLastDates(mockSet, identifier, storeNames[i], {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < storeNames.length; i++) {
      const expectedDate = new Date(baseDate.getTime() + i * 3600000);
      const result = await getLastDates(mockGet, identifier, storeNames[i]);
      log(`Retrieved dates for store ${storeNames[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }
  });

  it('should handle updating last updated and last accessed dates separately for multiple stores', async () => {
    const identifier = 'testId';
    const storeNames = ['storeX', 'storeY', 'storeZ'];
    const baseDate = new Date('2023-07-03T09:00:00.000Z');

    for (let i = 0; i < storeNames.length; i++) {
      const updatedDate = new Date(baseDate.getTime() + i * 3600000); // Add i hours
      const accessedDate = new Date(baseDate.getTime() + (i + 1) * 3600000); // Add i+1 hours
      await updateLastUpdatedDate(mockSet, identifier, storeNames[i], updatedDate);
      await updateLastAccessedDate(mockSet, identifier, storeNames[i], accessedDate);
    }

    for (let i = 0; i < storeNames.length; i++) {
      const result = await getLastDates(mockGet, identifier, storeNames[i]);
      log(`Retrieved dates for store ${storeNames[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(new Date(baseDate.getTime() + i * 3600000));
      expect(result.lastAccessedDate).toEqual(new Date(baseDate.getTime() + (i + 1) * 3600000));
    }
  });

  it('should handle concurrent read and write operations on multiple store names', async () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];
    const operationsPerStore = 20;
    const baseDate = new Date('2023-07-04T10:00:00.000Z');

    const operations = storeNames.flatMap((storeName) =>
      Array.from({ length: operationsPerStore }, (_, i) => {
        const date = new Date(baseDate.getTime() + i * 1000);
        return i % 2 === 0
          ? updateLastUpdatedDate(mockSet, identifier, storeName, date)
          : getLastUpdatedDate(mockGet, identifier, storeName);
      }),
    );

    await Promise.all(operations);

    for (const storeName of storeNames) {
      const result = await getLastDates(mockGet, identifier, storeName);
      const expectedDate = new Date(baseDate.getTime() + (operationsPerStore - 2) * 1000);
      log(`Final dates for store ${storeName}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
    }
  });

  it('should maintain data integrity when switching between different store names', async () => {
    const identifier = 'testId';
    const storeNames = ['storeA', 'storeB', 'storeC'];
    const iterations = 50;
    const baseDate = new Date('2023-07-05T08:00:00.000Z');

    for (let i = 0; i < iterations; i++) {
      const storeName = storeNames[i % storeNames.length];
      const date = new Date(baseDate.getTime() + i * 60000); // Add i minutes
      await updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });

      // Verify the update immediately
      const result = await getLastDates(mockGet, identifier, storeName);
      expect(result.lastUpdatedDate).toEqual(date);
      expect(result.lastAccessedDate).toEqual(date);
    }

    // Final verification
    for (const storeName of storeNames) {
      const result = await getLastDates(mockGet, identifier, storeName);
      const expectedDate = new Date(
        baseDate.getTime() +
          (iterations - storeNames.length + storeNames.indexOf(storeName)) * 60000,
      );
      log(`Final dates for store ${storeName}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }
  });
});
