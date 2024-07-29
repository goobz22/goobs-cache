import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-precision-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Precision', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Precision tests...');
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

  it('should maintain millisecond precision for last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-06-15T12:30:45.123Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date with millisecond precision: ${result.toISOString()}`);
    expect(result).toEqual(preciseDate);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should maintain millisecond precision for last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-06-15T12:30:45.789Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, preciseDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date with millisecond precision: ${result.toISOString()}`);
    expect(result).toEqual(preciseDate);
    expect(result.getMilliseconds()).toBe(789);
  });

  it('should handle microsecond precision input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const microsecondDate = new Date('2023-06-15T12:30:45.123456Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, microsecondDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date from microsecond input: ${result.toISOString()}`);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should handle nanosecond precision input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nanosecondDate = new Date('2023-06-15T12:30:45.123456789Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, nanosecondDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date from nanosecond input: ${result.toISOString()}`);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should maintain precision for dates very close to each other', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:30:45.123Z');
    const date2 = new Date('2023-06-15T12:30:45.124Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle precision at the turn of a second', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:30:59.999Z');
    const date2 = new Date('2023-06-15T12:31:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it("should maintain precision for dates at the limit of JavaScript's number precision", async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxPrecisionDate = new Date(Number.MAX_SAFE_INTEGER);

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxPrecisionDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date at limit of JavaScript's number precision: ${result.toISOString()}`);
    expect(result).toEqual(maxPrecisionDate);
    expect(result.getTime()).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle precision for dates with trailing zeros in milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T12:30:45.100Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with trailing zeros in milliseconds: ${result.toISOString()}`);
    expect(result).toEqual(date);
    expect(result.getMilliseconds()).toBe(100);
  });

  it('should maintain precision across multiple updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dates = [
      new Date('2023-06-15T12:30:45.123Z'),
      new Date('2023-06-15T12:30:45.456Z'),
      new Date('2023-06-15T12:30:45.789Z'),
    ];

    for (const date of dates) {
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const result = await getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Retrieved date after update: ${result.toISOString()}`);
      expect(result).toEqual(date);
      expect(result.getMilliseconds()).toBe(date.getMilliseconds());
    }
  });

  it('should handle precision at the turn of a minute', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:59:59.999Z');
    const date2 = new Date('2023-06-15T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should maintain precision for dates with maximum millisecond value', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxMillisecondDate = new Date('2023-06-15T12:30:45.999Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxMillisecondDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with maximum millisecond value: ${result.toISOString()}`);
    expect(result).toEqual(maxMillisecondDate);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('should handle precision for dates with minimum millisecond value', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minMillisecondDate = new Date('2023-06-15T12:30:45.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, minMillisecondDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with minimum millisecond value: ${result.toISOString()}`);
    expect(result).toEqual(minMillisecondDate);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should maintain precision when updating with current system time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const systemDate = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, systemDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date updated with system time: ${result.toISOString()}`);
    expect(result).toEqual(systemDate);
    expect(result.getMilliseconds()).toBe(systemDate.getMilliseconds());
  });

  it('should handle precision for dates across different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateInDifferentTZ = new Date('2023-06-15T12:30:45.123+05:30');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateInDifferentTZ);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date from different time zone: ${result.toISOString()}`);
    expect(result.getTime()).toBe(dateInDifferentTZ.getTime());
    expect(result.getUTCHours()).toBe(7); // 12:30 +05:30 is 07:00 UTC
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(45);
    expect(result.getUTCMilliseconds()).toBe(123);
  });

  it('should maintain precision when dealing with leap seconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This is a hypothetical leap second. Actual leap seconds are added at specific times.
    const leapSecondDate = new Date('2023-06-30T23:59:60.500Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, leapSecondDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with leap second: ${result.toISOString()}`);
    // JavaScript doesn't handle leap seconds specially, so it will roll over to the next day
    expect(result).toEqual(new Date('2023-07-01T00:00:00.500Z'));
  });

  it('should handle precision for dates very close to the Unix epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearEpochDate = new Date('1970-01-01T00:00:00.001Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, nearEpochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date near Unix epoch: ${result.toISOString()}`);
    expect(result).toEqual(nearEpochDate);
    expect(result.getTime()).toBe(1);
  });

  it('should maintain precision for dates far in the future', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const farFutureDate = new Date('2100-12-31T23:59:59.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, farFutureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date far in the future: ${result.toISOString()}`);
    expect(result).toEqual(farFutureDate);
    expect(result.getFullYear()).toBe(2100);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});
