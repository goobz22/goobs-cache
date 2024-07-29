import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-edge-cases-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Edge Cases', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Edge Cases tests...');
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

  it('should handle date at Unix epoch (1970-01-01T00:00:00.000Z)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date at Unix epoch: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle date just before Unix epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preEpochDate = new Date('1969-12-31T23:59:59.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, preEpochDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date just before Unix epoch: ${result.toISOString()}`);
    expect(result).toEqual(preEpochDate);
  });

  it('should handle maximum date allowed by ECMAScript (8640000000000000ms)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000);

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved maximum date: ${result.toISOString()}`);
    expect(result).toEqual(maxDate);
  });

  it('should handle minimum date allowed by ECMAScript (-8640000000000000ms)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minDate = new Date(-8640000000000000);

    await updateLastAccessedDate(mockSet, identifier, storeName, minDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved minimum date: ${result.toISOString()}`);
    expect(result).toEqual(minDate);
  });

  it('should handle date with maximum millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-06-15T12:30:45.999Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with maximum millisecond precision: ${result.toISOString()}`);
    expect(result).toEqual(preciseDate);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('should handle leap year date (February 29)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const leapYearDate = new Date('2024-02-29T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, leapYearDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved leap year date: ${result.toISOString()}`);
    expect(result).toEqual(leapYearDate);
    expect(result.getUTCMonth()).toBe(1); // February
    expect(result.getUTCDate()).toBe(29);
  });

  it('should handle date transition across daylight saving time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59.000Z');
    const afterDST = new Date('2023-03-12T03:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeDST,
      lastAccessedDate: afterDST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date before DST: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date after DST: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(beforeDST);
    expect(result.lastAccessedDate).toEqual(afterDST);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(3600001); // 1 hour and 1 millisecond difference
  });

  it('should handle date with timezone offset', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithOffset = new Date('2023-06-15T12:00:00+04:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateWithOffset);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with timezone offset: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(dateWithOffset.getTime());
    expect(result.toUTCString()).toEqual('Thu, 15 Jun 2023 08:00:00 GMT');
  });

  it('should handle updating with invalid Date object', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('Invalid Date');

    await updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date after invalid Date input: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle very small time difference between updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-15T12:00:00.001Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, date2);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after small time difference update: ${result.toISOString()}`);
    expect(result).toEqual(date2);
    expect(result.getTime() - date1.getTime()).toBe(1);
  });

  it('should handle date at the end of a month', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const endOfMonthDate = new Date('2023-06-30T23:59:59.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, endOfMonthDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date at the end of a month: ${result.toISOString()}`);
    expect(result).toEqual(endOfMonthDate);
    expect(result.getUTCDate()).toBe(30);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('should handle date transition across a year boundary', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeNewYear = new Date('2023-12-31T23:59:59.999Z');
    const afterNewYear = new Date('2024-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeNewYear,
      lastAccessedDate: afterNewYear,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date before New Year: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date after New Year: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(beforeNewYear);
    expect(result.lastAccessedDate).toEqual(afterNewYear);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle extremely large identifier and store name', async () => {
    const identifier = 'a'.repeat(10000);
    const storeName = 'b'.repeat(10000);
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with extremely large identifier and store name: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const baseDate = new Date('2023-06-15T12:00:00.000Z');
    const updateCount = 1000;

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after rapid successive updates: ${result.toISOString()}`);
    expect(result).toEqual(new Date(baseDate.getTime() + updateCount - 1));
  });

  it('should handle date with non-integer milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithFraction = new Date('2023-06-15T12:00:00.123456Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, dateWithFraction);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with non-integer milliseconds: ${result.toISOString()}`);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should handle updating with current date (Date.now())', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = Date.now();

    await updateLastUpdatedDate(mockSet, identifier, storeName, new Date());
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    const after = Date.now();

    log(`Retrieved date updated with current date: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it('should handle date at the limit of 32-bit timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date32BitLimit = new Date(2147483647000); // 2^31 - 1 seconds since epoch

    await updateLastAccessedDate(mockSet, identifier, storeName, date32BitLimit);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date at 32-bit timestamp limit: ${result.toISOString()}`);
    expect(result).toEqual(date32BitLimit);
  });

  it('should handle concurrent updates to different identifiers', async () => {
    const storeNameBase = 'testStore';
    const date = new Date('2023-06-15T12:00:00.000Z');
    const updateCount = 100;

    const updatePromises = Array.from({ length: updateCount }, (_, i) =>
      updateLastUpdatedDate(
        mockSet,
        `testId${i}`,
        `${storeNameBase}${i}`,
        new Date(date.getTime() + i),
      ),
    );

    await Promise.all(updatePromises);

    const retrievePromises = Array.from({ length: updateCount }, (_, i) =>
      getLastUpdatedDate(mockGet, `testId${i}`, `${storeNameBase}${i}`),
    );

    const results = await Promise.all(retrievePromises);

    results.forEach((result, index) => {
      log(`Retrieved date for concurrent update ${index}: ${result.toISOString()}`);
      expect(result).toEqual(new Date(date.getTime() + index));
    });
  });
});
