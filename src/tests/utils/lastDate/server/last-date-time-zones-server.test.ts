import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-time-zones-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Time Zone Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Time Zone Handling tests...');
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

  it('should handle UTC dates correctly', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const utcDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, utcDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved UTC date: ${result.toISOString()}`);
    expect(result).toEqual(utcDate);
    expect(result.getUTCHours()).toBe(12);
  });

  it('should handle dates with positive UTC offset', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithOffset = new Date('2023-06-15T12:00:00+04:00');

    await updateLastAccessedDate(mockSet, identifier, storeName, dateWithOffset);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with positive UTC offset: ${result.toISOString()}`);
    expect(result.getUTCHours()).toBe(8); // 12:00 +04:00 is 08:00 UTC
  });

  it('should handle dates with negative UTC offset', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithOffset = new Date('2023-06-15T12:00:00-05:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateWithOffset);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with negative UTC offset: ${result.toISOString()}`);
    expect(result.getUTCHours()).toBe(17); // 12:00 -05:00 is 17:00 UTC
  });

  it('should maintain consistency across different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const utcDate = new Date('2023-06-15T12:00:00.000Z');
    const estDate = new Date('2023-06-15T07:00:00-05:00'); // EST is UTC-5

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: utcDate,
      lastAccessedDate: estDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved UTC date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved EST date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBe(result.lastAccessedDate.getTime());
  });

  it('should handle dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59-05:00'); // Just before DST transition in EST
    const afterDST = new Date('2023-03-12T03:00:00-04:00'); // Just after DST transition in EDT

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeDST,
      lastAccessedDate: afterDST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date before DST: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date after DST: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(3600000); // 1 hour difference
  });

  it('should handle dates in time zones with partial-hour offsets', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithPartialOffset = new Date('2023-06-15T12:00:00+05:30'); // India Standard Time

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateWithPartialOffset);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with partial-hour offset: ${result.toISOString()}`);
    expect(result.getUTCHours()).toBe(6);
    expect(result.getUTCMinutes()).toBe(30);
  });

  it('should maintain millisecond precision across time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWithMilliseconds = new Date('2023-06-15T12:00:00.123+02:00');

    await updateLastAccessedDate(mockSet, identifier, storeName, dateWithMilliseconds);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with millisecond precision: ${result.toISOString()}`);
    expect(result.getUTCMilliseconds()).toBe(123);
  });

  it('should handle date comparisons across different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:00:00+01:00');
    const date2 = new Date('2023-06-15T12:30:00+02:00');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved first date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved second date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1800000); // 30 minutes difference
  });

  it('should handle dates at the International Date Line', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateWestOfIDL = new Date('2023-06-15T23:59:59-12:00'); // Just west of IDL
    const dateEastOfIDL = new Date('2023-06-16T00:00:00+12:00'); // Just east of IDL

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: dateWestOfIDL,
      lastAccessedDate: dateEastOfIDL,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date west of IDL: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date east of IDL: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(86400000); // 24 hours difference
  });

  it('should handle extreme time zone offsets', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateExtremeWest = new Date('2023-06-15T12:00:00-12:00'); // Extreme western time zone
    const dateExtremeEast = new Date('2023-06-15T12:00:00+14:00'); // Extreme eastern time zone

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: dateExtremeWest,
      lastAccessedDate: dateExtremeEast,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date from extreme western time zone: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date from extreme eastern time zone: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(93600000); // 26 hours difference
  });

  it('should handle dates during time zone transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This test assumes a DST transition. Adjust the date if necessary.
    const transitionDate = new Date('2023-11-05T01:59:59-04:00'); // Just before fall DST transition in EDT

    await updateLastUpdatedDate(mockSet, identifier, storeName, transitionDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date during time zone transition: ${result.toISOString()}`);
    expect(result).toEqual(transitionDate);
  });

  it('should maintain consistency for dates in non-existent time slots', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This date doesn't exist due to DST spring forward
    const nonExistentDate = new Date('2023-03-12T02:30:00-05:00');

    await updateLastAccessedDate(mockSet, identifier, storeName, nonExistentDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved non-existent date: ${result.toISOString()}`);
    // The exact behavior might depend on the system, but it should be consistent
    expect(result.getTime()).toBe(nonExistentDate.getTime());
  });

  it('should handle dates in time zones with historical changes', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This date is before Moscow changed its time zone offset
    const historicalDate = new Date('2011-03-27T02:00:00+03:00');

    await updateLastUpdatedDate(mockSet, identifier, storeName, historicalDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with historical time zone change: ${result.toISOString()}`);
    expect(result).toEqual(historicalDate);
  });

  it('should handle dates across years with different DST rules', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date2006 = new Date('2006-10-29T01:59:59-04:00'); // Before US changed DST rules
    const date2007 = new Date('2007-11-04T01:59:59-04:00'); // After US changed DST rules

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date2006,
      lastAccessedDate: date2007,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date from 2006: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date from 2007: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date2006);
    expect(result.lastAccessedDate).toEqual(date2007);
  });

  it('should maintain consistency when switching between standard time and DST', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const standardTimeDate = new Date('2023-01-15T12:00:00-05:00'); // EST
    const daylightSavingTimeDate = new Date('2023-07-15T12:00:00-04:00'); // EDT

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: standardTimeDate,
      lastAccessedDate: daylightSavingTimeDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved standard time date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved daylight saving time date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(15552000000); // Exactly 6 months apart
  });

  it('should handle dates in time zones affected by geopolitical changes', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This date is before Crimea changed its time zone
    const beforeChangeDate = new Date('2014-03-15T12:00:00+02:00');
    // This date is after Crimea changed its time zone
    const afterChangeDate = new Date('2014-03-30T12:00:00+04:00');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeChangeDate,
      lastAccessedDate: afterChangeDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date before geopolitical change: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date after geopolitical change: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(beforeChangeDate);
    expect(result.lastAccessedDate).toEqual(afterChangeDate);
  });
});
