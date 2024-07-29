import { updateLastAccessedDate, getLastAccessedDate } from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-accessed-date-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - updateLastAccessedDate', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities updateLastAccessedDate tests...');
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

  it('should update last accessed date correctly', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should update last accessed date with current date when no date is provided', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);
    const after = new Date();

    log(`Updated and retrieved last accessed date with no date provided: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle updating with an earlier date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-07-01T12:00:00.000Z');
    const earlierDate = new Date('2023-06-30T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, earlierDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with an earlier date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(earlierDate);
  });

  it('should handle updating with the same date multiple times', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      await updateLastAccessedDate(mockSet, identifier, storeName, date);
    }
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Updated with the same date multiple times and retrieved last accessed date: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle updating with an invalid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with an invalid date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle updating with a very far future date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const farFutureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, farFutureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with a far future date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(farFutureDate);
  });

  it('should handle updating with a very old date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const veryOldDate = new Date('1900-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, veryOldDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with a very old date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(veryOldDate);
  });

  it('should handle updating with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-07-01T12:00:00.123Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Updated with millisecond precision and retrieved last accessed date: ${result.toISOString()}`,
    );
    expect(result).toEqual(preciseDate);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should handle updating for multiple identifiers independently', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const date1 = new Date('2023-07-01T12:00:00.000Z');
    const date2 = new Date('2023-07-02T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier1, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier1, storeName);
    const result2 = await getLastAccessedDate(mockGet, identifier2, storeName);

    log(`Retrieved last accessed date for identifier1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating for multiple store names independently', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-07-01T12:00:00.000Z');
    const date2 = new Date('2023-07-02T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for storeName1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating with a Date object at the epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastAccessedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with epoch date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with a date just before the maximum date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearMaxDate = new Date(8640000000000000 - 1);

    await updateLastAccessedDate(mockSet, identifier, storeName, nearMaxDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with near maximum date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(nearMaxDate);
  });

  it('should handle updating with a date just after the minimum date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearMinDate = new Date(-8640000000000000 + 1);

    await updateLastAccessedDate(mockSet, identifier, storeName, nearMinDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated with near minimum date and retrieved last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(nearMinDate);
  });

  it('should handle rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 1000;
    const baseDate = new Date('2023-07-01T12:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastAccessedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after rapid successive updates: ${result.toISOString()}`);
    expect(result).toEqual(new Date(baseDate.getTime() + updateCount - 1));
  });

  it('should handle updating with dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59.000Z');
    const afterDST = new Date('2023-03-12T03:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, beforeDST);
    let result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date before DST transition: ${result.toISOString()}`);
    expect(result).toEqual(beforeDST);

    await updateLastAccessedDate(mockSet, identifier, storeName, afterDST);
    result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date after DST transition: ${result.toISOString()}`);
    expect(result).toEqual(afterDST);
  });

  it('should handle updating with dates in different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateUTC = new Date('2023-07-01T12:00:00.000Z');
    const dateEST = new Date('2023-07-01T12:00:00.000-05:00');

    await updateLastAccessedDate(mockSet, identifier, storeName, dateUTC);
    let result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date set in UTC: ${result.toISOString()}`);
    expect(result).toEqual(dateUTC);

    await updateLastAccessedDate(mockSet, identifier, storeName, dateEST);
    result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date set in EST: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(dateEST.getTime());
  });

  it('should handle updating with a date object with overridden toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');
    date.toISOString = () => '2023-07-02T12:00:00.000Z';

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set with overridden toISOString: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-07-02T12:00:00.000Z'));
  });

  it('should handle concurrent updates to the same identifier and store', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 100;
    const baseDate = new Date('2023-07-01T12:00:00.000Z');

    const updatePromises = Array.from({ length: updateCount }, (_, i) => {
      const date = new Date(baseDate.getTime() + i);
      return updateLastAccessedDate(mockSet, identifier, storeName, date);
    });

    await Promise.all(updatePromises);

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after concurrent updates: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(baseDate.getTime() + updateCount - 1);
  });

  it('should handle updating with a frozen Date object', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const frozenDate = Object.freeze(new Date('2023-07-01T12:00:00.000Z'));

    await updateLastAccessedDate(mockSet, identifier, storeName, frozenDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set with frozen Date object: ${result.toISOString()}`);
    expect(result).toEqual(frozenDate);
  });

  it('should handle updating with a Date object near the year 0', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearYearZeroDate = new Date('0001-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, nearYearZeroDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set near year 0: ${result.toISOString()}`);
    expect(result).toEqual(nearYearZeroDate);
  });

  it('should handle updating with a Date object in the distant future', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const distantFutureDate = new Date('9999-12-31T23:59:59.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, distantFutureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set in the distant future: ${result.toISOString()}`);
    expect(result).toEqual(distantFutureDate);
  });

  it('should handle updating with a non-Date object that has a valid toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pseudoDate = {
      toISOString: () => '2023-07-01T12:00:00.000Z',
    };

    await updateLastAccessedDate(mockSet, identifier, storeName, pseudoDate as unknown as Date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set with pseudo-Date object: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-07-01T12:00:00.000Z'));
  });

  it('should handle updating multiple times within the same millisecond', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    // Simulate multiple updates within the same millisecond
    await Promise.all([
      updateLastAccessedDate(mockSet, identifier, storeName, date),
      updateLastAccessedDate(mockSet, identifier, storeName, date),
      updateLastAccessedDate(mockSet, identifier, storeName, date),
    ]);

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last accessed date after multiple updates in same millisecond: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle updating with a Date object at the maximum safe integer timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeDate = new Date(Number.MAX_SAFE_INTEGER);

    await updateLastAccessedDate(mockSet, identifier, storeName, maxSafeDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set at maximum safe integer: ${result.toISOString()}`);
    expect(result).toEqual(maxSafeDate);
  });

  it('should handle updating with a Date object created from a custom number of milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customMilliseconds = 1625160000000; // Some arbitrary milliseconds value
    const customDate = new Date(customMilliseconds);

    await updateLastAccessedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set from custom milliseconds: ${result.toISOString()}`);
    expect(result).toEqual(customDate);
  });

  it('should handle updating with a Date object and then immediately retrieving', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date immediately after setting: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle updating with an invalid Date object gracefully', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after setting invalid Date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle updating the same identifier in different stores', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-07-01T12:00:00.000Z');
    const date2 = new Date('2023-07-02T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for store1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for store2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating with a Date object representing the current time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, now);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date set to current time: ${result.toISOString()}`);
    expect(result.getTime()).toBeCloseTo(now.getTime(), -3); // Allow 1 second difference
  });
});
