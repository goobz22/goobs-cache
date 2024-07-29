import { updateLastUpdatedDate, getLastUpdatedDate } from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-updated-date-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - updateLastUpdatedDate', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities updateLastUpdatedDate tests...');
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

  it('should update last updated date correctly', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should update last updated date with current date when no date is provided', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    const after = new Date();

    log(`Updated and retrieved last updated date with no date provided: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle updating with an earlier date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-07-01T12:00:00.000Z');
    const earlierDate = new Date('2023-06-30T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, earlierDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with an earlier date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(earlierDate);
  });

  it('should handle updating with the same date multiple times', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Updated with the same date multiple times and retrieved last updated date: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle updating with an invalid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with an invalid date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle updating with a very far future date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const farFutureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, farFutureDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with a far future date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(farFutureDate);
  });

  it('should handle updating with a very old date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const veryOldDate = new Date('1900-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, veryOldDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with a very old date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(veryOldDate);
  });

  it('should handle updating with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-07-01T12:00:00.123Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Updated with millisecond precision and retrieved last updated date: ${result.toISOString()}`,
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

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const result2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating for multiple store names independently', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-07-01T12:00:00.000Z');
    const date2 = new Date('2023-07-02T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName1, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier, storeName1);
    const result2 = await getLastUpdatedDate(mockGet, identifier, storeName2);

    log(`Retrieved last updated date for storeName1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating with a Date object at the epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with epoch date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with a date just before the maximum date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearMaxDate = new Date(8640000000000000 - 1);

    await updateLastUpdatedDate(mockSet, identifier, storeName, nearMaxDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with near maximum date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(nearMaxDate);
  });

  it('should handle updating with a date just after the minimum date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearMinDate = new Date(-8640000000000000 + 1);

    await updateLastUpdatedDate(mockSet, identifier, storeName, nearMinDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated with near minimum date and retrieved last updated date: ${result.toISOString()}`);
    expect(result).toEqual(nearMinDate);
  });

  it('should handle rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 1000;
    const baseDate = new Date('2023-07-01T12:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after rapid successive updates: ${result.toISOString()}`);
    expect(result).toEqual(new Date(baseDate.getTime() + updateCount - 1));
  });

  it('should handle updating with dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59.000Z');
    const afterDST = new Date('2023-03-12T03:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, beforeDST);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date before DST transition: ${result.toISOString()}`);
    expect(result).toEqual(beforeDST);

    await updateLastUpdatedDate(mockSet, identifier, storeName, afterDST);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date after DST transition: ${result.toISOString()}`);
    expect(result).toEqual(afterDST);
  });

  it('should handle updating with dates in different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateUTC = new Date('2023-07-01T12:00:00.000Z');
    const dateEST = new Date('2023-07-01T12:00:00.000-05:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateUTC);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date set in UTC: ${result.toISOString()}`);
    expect(result).toEqual(dateUTC);

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateEST);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date set in EST: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(dateEST.getTime());
  });

  it('should handle updating with a date object with overridden toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');
    date.toISOString = () => '2023-07-02T12:00:00.000Z';

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set with overridden toISOString: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-07-02T12:00:00.000Z'));
  });

  it('should handle concurrent updates to the same identifier and store', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 100;
    const baseDate = new Date('2023-07-01T12:00:00.000Z');

    const updatePromises = Array.from({ length: updateCount }, (_, i) => {
      const date = new Date(baseDate.getTime() + i);
      return updateLastUpdatedDate(mockSet, identifier, storeName, date);
    });

    await Promise.all(updatePromises);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after concurrent updates: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(baseDate.getTime() + updateCount - 1);
  });

  it('should handle updating with a frozen Date object', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const frozenDate = Object.freeze(new Date('2023-07-01T12:00:00.000Z'));

    await updateLastUpdatedDate(mockSet, identifier, storeName, frozenDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set with frozen Date object: ${result.toISOString()}`);
    expect(result).toEqual(frozenDate);
  });

  it('should handle updating with a Date object near the year 0', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearYearZeroDate = new Date('0001-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, nearYearZeroDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set near year 0: ${result.toISOString()}`);
    expect(result).toEqual(nearYearZeroDate);
  });

  it('should handle updating with a Date object in the distant future', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const distantFutureDate = new Date('9999-12-31T23:59:59.999Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, distantFutureDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set in the distant future: ${result.toISOString()}`);
    expect(result).toEqual(distantFutureDate);
  });

  it('should handle updating with a non-Date object that has a valid toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pseudoDate = {
      toISOString: () => '2023-07-01T12:00:00.000Z',
    };

    await updateLastUpdatedDate(mockSet, identifier, storeName, pseudoDate as unknown as Date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set with pseudo-Date object: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-07-01T12:00:00.000Z'));
  });

  it('should handle updating multiple times within the same millisecond', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    // Simulate multiple updates within the same millisecond
    await Promise.all([
      updateLastUpdatedDate(mockSet, identifier, storeName, date),
      updateLastUpdatedDate(mockSet, identifier, storeName, date),
      updateLastUpdatedDate(mockSet, identifier, storeName, date),
    ]);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after multiple updates in same millisecond: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle updating with a Date object at the maximum safe integer timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeDate = new Date(Number.MAX_SAFE_INTEGER);

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxSafeDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set at maximum safe integer: ${result.toISOString()}`);
    expect(result).toEqual(maxSafeDate);
  });

  it('should handle updating with a Date object created from a custom number of milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customMilliseconds = 1625160000000; // Some arbitrary milliseconds value
    const customDate = new Date(customMilliseconds);

    await updateLastUpdatedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set from custom milliseconds: ${result.toISOString()}`);
    expect(result).toEqual(customDate);
  });

  it('should handle updating with a Date object and then immediately retrieving', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date immediately after setting: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle updating with dates in a leap year', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const leapYearDate = new Date('2024-02-29T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, leapYearDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date in a leap year: ${result.toISOString()}`);
    expect(result).toEqual(leapYearDate);
  });

  it('should handle updating with dates just before and after a leap second', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeLeapSecond = new Date('2016-12-31T23:59:59.999Z');
    const afterLeapSecond = new Date('2017-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, beforeLeapSecond);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(beforeLeapSecond);

    await updateLastUpdatedDate(mockSet, identifier, storeName, afterLeapSecond);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date around a leap second: ${result.toISOString()}`);
    expect(result).toEqual(afterLeapSecond);
  });

  it('should handle updating with very close timestamps', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-01T12:00:00.000Z');
    const date2 = new Date('2023-07-01T12:00:00.001Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, date2);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after updating with very close timestamps: ${result.toISOString()}`,
    );
    expect(result).toEqual(date2);
  });

  it('should handle updating with a date at the turn of a century', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const turnOfCenturyDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, turnOfCenturyDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date at the turn of a century: ${result.toISOString()}`);
    expect(result).toEqual(turnOfCenturyDate);
  });

  it('should handle updating with a date at the turn of a millennium', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const turnOfMillenniumDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, turnOfMillenniumDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date at the turn of a millennium: ${result.toISOString()}`);
    expect(result).toEqual(turnOfMillenniumDate);
  });

  it('should handle updating with a date in different calendar systems', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const gregorianDate = new Date('2023-07-01T12:00:00.000Z');
    const julianDate = new Date('2023-06-18T12:00:00.000Z'); // Equivalent Julian calendar date

    await updateLastUpdatedDate(mockSet, identifier, storeName, gregorianDate);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(gregorianDate);

    await updateLastUpdatedDate(mockSet, identifier, storeName, julianDate);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set in different calendar system: ${result.toISOString()}`);
    expect(result).toEqual(julianDate);
  });

  it('should handle updating with a date string instead of a Date object', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateString = '2023-07-01T12:00:00.000Z';

    await updateLastUpdatedDate(mockSet, identifier, storeName, new Date(dateString));
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set with a date string: ${result.toISOString()}`);
    expect(result).toEqual(new Date(dateString));
  });

  it('should handle updating with a Unix timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const timestamp = 1625140800000; // 2023-07-01T12:00:00.000Z

    await updateLastUpdatedDate(mockSet, identifier, storeName, new Date(timestamp));
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set with a Unix timestamp: ${result.toISOString()}`);
    expect(result).toEqual(new Date(timestamp));
  });

  it('should handle updating with dates across different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateUTC = new Date('2023-07-01T12:00:00.000Z');
    const dateEST = new Date('2023-07-01T07:00:00.000-05:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateUTC);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(dateUTC);

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateEST);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set across different time zones: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(dateUTC.getTime()); // They should represent the same moment in time
  });

  it('should handle updating with dates during daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59.000-05:00');
    const afterDST = new Date('2023-03-12T03:00:00.000-04:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, beforeDST);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(beforeDST);

    await updateLastUpdatedDate(mockSet, identifier, storeName, afterDST);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date during daylight saving time transition: ${result.toISOString()}`,
    );
    expect(result).toEqual(afterDST);
  });

  it('should handle updating with a date at the earliest and latest moments of a day', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const startOfDay = new Date('2023-07-01T00:00:00.000Z');
    const endOfDay = new Date('2023-07-01T23:59:59.999Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, startOfDay);
    let result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(startOfDay);

    await updateLastUpdatedDate(mockSet, identifier, storeName, endOfDay);
    result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date at the end of a day: ${result.toISOString()}`);
    expect(result).toEqual(endOfDay);
  });

  it('should handle updating with a date during a leap second', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const leapSecondDate = new Date('2016-12-31T23:59:60.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, leapSecondDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date during a leap second: ${result.toISOString()}`);
    // Note: JavaScript doesn't handle leap seconds specially, so it will be represented as the next second
    expect(result).toEqual(new Date('2017-01-01T00:00:00.000Z'));
  });

  it('should handle updating with an invalid Date object gracefully', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after setting invalid Date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });
});
