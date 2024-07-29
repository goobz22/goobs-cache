import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-persistence-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Persistence', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Persistence tests...');
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

  it('should persist last updated date across multiple operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const updatedDate = new Date('2023-06-15T13:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(initialDate);

    await updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Persisted last updated date: ${result.toISOString()}`);
    expect(result).toEqual(updatedDate);
  });

  it('should persist last accessed date across multiple operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-16T12:00:00.000Z');
    const updatedDate = new Date('2023-06-16T13:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    let result = await getLastAccessedDate(mockGet, identifier, storeName);
    expect(result).toEqual(initialDate);

    await updateLastAccessedDate(mockSet, identifier, storeName, updatedDate);
    result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Persisted last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(updatedDate);
  });

  it('should persist both dates independently', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T12:00:00.000Z');
    const accessedDate = new Date('2023-06-17T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Persisted last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Persisted last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should maintain persistence after simulated server restart', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-18T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);

    // Simulate server restart by recreating mock functions
    const persistedStorage = { ...mockStorage };
    mockGet = jest.fn(async (key: string): Promise<string | null> => persistedStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      persistedStorage[key] = value;
    });

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after simulated server restart: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle multiple updates and retrievals in sequence', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dates = [
      new Date('2023-06-19T12:00:00.000Z'),
      new Date('2023-06-19T13:00:00.000Z'),
      new Date('2023-06-19T14:00:00.000Z'),
    ];

    for (const date of dates) {
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const result = await getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Updated and retrieved date: ${result.toISOString()}`);
      expect(result).toEqual(date);
    }

    const finalResult = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(finalResult).toEqual(dates[dates.length - 1]);
  });

  it('should persist data for multiple identifiers and store names', async () => {
    const identifiers = ['id1', 'id2'];
    const storeNames = ['store1', 'store2'];
    const date = new Date('2023-06-20T12:00:00.000Z');

    for (const identifier of identifiers) {
      for (const storeName of storeNames) {
        await updateLastDates(mockSet, identifier, storeName, {
          lastUpdatedDate: date,
          lastAccessedDate: date,
        });
      }
    }

    for (const identifier of identifiers) {
      for (const storeName of storeNames) {
        const result = await getLastDates(mockGet, identifier, storeName);
        log(`Retrieved dates for ${identifier} in ${storeName}:`);
        log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
        log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
        expect(result.lastUpdatedDate).toEqual(date);
        expect(result.lastAccessedDate).toEqual(date);
      }
    }
  });

  it('should handle persistence of dates with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-06-21T12:00:00.123Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Persisted date with millisecond precision: ${result.toISOString()}`);
    expect(result).toEqual(preciseDate);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should maintain data integrity during rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 100;
    const baseDate = new Date('2023-06-22T12:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after rapid successive updates: ${result.toISOString()}`);
    expect(result).toEqual(new Date(baseDate.getTime() + updateCount - 1));
  });

  it('should persist data correctly after updating with the same date multiple times', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-23T12:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      await updateLastAccessedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date after multiple updates with the same date: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle persistence when switching between different identifiers and store names', async () => {
    const identifiers = ['id1', 'id2'];
    const storeNames = ['store1', 'store2'];
    const date1 = new Date('2023-06-24T12:00:00.000Z');
    const date2 = new Date('2023-06-24T13:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifiers[0], storeNames[0], date1);
    await updateLastUpdatedDate(mockSet, identifiers[1], storeNames[1], date2);

    const result1 = await getLastUpdatedDate(mockGet, identifiers[0], storeNames[0]);
    const result2 = await getLastUpdatedDate(mockGet, identifiers[1], storeNames[1]);

    log(`Retrieved date for ${identifiers[0]} in ${storeNames[0]}: ${result1.toISOString()}`);
    log(`Retrieved date for ${identifiers[1]} in ${storeNames[1]}: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should persist data correctly when updating only one of the dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-25T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should handle persistence of very old dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const oldDate = new Date('1970-01-01T00:00:00.001Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, oldDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Persisted very old date: ${result.toISOString()}`);
    expect(result).toEqual(oldDate);
  });

  it('should handle persistence of future dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, futureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Persisted future date: ${result.toISOString()}`);
    expect(result).toEqual(futureDate);
  });

  it('should maintain persistence after multiple simulated server restarts', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-26T12:00:00.000Z');
    const date2 = new Date('2023-06-26T13:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);

    // First simulated restart
    let persistedStorage = { ...mockStorage };
    mockGet = jest.fn(async (key: string): Promise<string | null> => persistedStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      persistedStorage[key] = value;
    });

    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(date1);

    await updateLastUpdatedDate(mockSet, identifier, storeName, date2);

    // Second simulated restart
    persistedStorage = { ...persistedStorage };
    mockGet = jest.fn(async (key: string): Promise<string | null> => persistedStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      persistedStorage[key] = value;
    });

    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after multiple simulated server restarts: ${result.toISOString()}`);
    expect(result).toEqual(date2);
  });

  it('should handle persistence when clearing and re-initializing data', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-27T12:00:00.000Z');
    const newDate = new Date('2023-06-27T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    // Clear data
    mockStorage = {};

    // Re-initialize
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: newDate,
      lastAccessedDate: newDate,
    });

    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after clearing and re-initializing: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after clearing and re-initializing: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(newDate);
    expect(result.lastAccessedDate).toEqual(newDate);
  });

  it('should persist data correctly when updating dates in reverse chronological order', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const olderDate = new Date('2023-06-28T12:00:00.000Z');
    const newerDate = new Date('2023-06-28T13:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, newerDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, olderDate);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after updating in reverse chronological order: ${result.toISOString()}`);
    expect(result).toEqual(olderDate);
  });

  it('should handle persistence of dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Dates before and after a typical DST transition
    const beforeDST = new Date('2023-03-12T01:59:59.000Z');
    const afterDST = new Date('2023-03-12T03:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeDST,
      lastAccessedDate: afterDST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date (before DST): ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date (after DST): ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(beforeDST);
    expect(result.lastAccessedDate).toEqual(afterDST);
  });

  it('should maintain data integrity during concurrent updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const baseDate = new Date('2023-06-29T12:00:00.000Z');
    const updateCount = 100;

    const updatePromises = Array.from({ length: updateCount }, (_, i) =>
      updateLastUpdatedDate(mockSet, identifier, storeName, new Date(baseDate.getTime() + i)),
    );

    await Promise.all(updatePromises);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after concurrent updates: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(baseDate.getTime() + updateCount - 1);
  });

  it('should persist data correctly when alternating between different types of updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-30T12:00:00.000Z');
    const date2 = new Date('2023-06-30T13:00:00.000Z');
    const date3 = new Date('2023-06-30T14:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName, date2);
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date3,
      lastAccessedDate: date3,
    });

    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after alternating updates: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after alternating updates: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(date3);
    expect(result.lastAccessedDate).toEqual(date3);
  });

  it('should handle persistence of maximum and minimum representable dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000); // Maximum date
    const minDate = new Date(-8640000000000000); // Minimum date

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: maxDate,
      lastAccessedDate: minDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved maximum date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved minimum date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(maxDate);
    expect(result.lastAccessedDate).toEqual(minDate);
  });

  it('should maintain persistence after simulated network failures', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);

    // Simulate network failure
    mockGet.mockRejectedValueOnce(new Error('Network failure'));
    await expect(getLastUpdatedDate(mockGet, identifier, storeName)).rejects.toThrow(
      'Network failure',
    );

    // Retry after "network is restored"
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after simulated network failure: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });
});
