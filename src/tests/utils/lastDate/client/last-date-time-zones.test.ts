import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-time-zones-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Time Zones', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Time Zones tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = (key: string): string | null => mockStorage[key] || null;
    mockSet = (key: string, value: string): void => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle UTC dates correctly', () => {
    log('\nTesting handling of UTC dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const utcDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, utcDate);

    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved UTC date: ${retrievedDate.toISOString()}`);

    expect(retrievedDate).toEqual(utcDate);
    expect(retrievedDate.getUTCHours()).toBe(10);
    expect(retrievedDate.getUTCMinutes()).toBe(30);
  });

  it('should handle non-UTC dates correctly', () => {
    log('\nTesting handling of non-UTC dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const nonUtcDate = new Date('2023-06-15T10:30:00-04:00'); // EDT time

    updateLastAccessedDate(mockSet, identifier, storeName, nonUtcDate);

    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved non-UTC date: ${retrievedDate.toISOString()}`);

    expect(retrievedDate.getUTCHours()).toBe(14); // 10 AM EDT is 2 PM UTC
    expect(retrievedDate.getUTCMinutes()).toBe(30);
  });

  it('should maintain consistency across different time zones', () => {
    log('\nTesting consistency across different time zones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const utcDate = new Date('2023-06-15T10:30:00.000Z');
    const estDate = new Date('2023-06-15T06:30:00.000-04:00');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: utcDate,
      lastAccessedDate: estDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved UTC date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved EST date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(lastAccessedDate.getTime());
  });

  it('should handle daylight saving time transitions', () => {
    log('\nTesting handling of daylight saving time transitions...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const winterDate = new Date('2023-03-12T01:59:59.000-05:00'); // Just before DST starts
    const summerDate = new Date('2023-03-12T03:00:00.000-04:00'); // Just after DST starts

    updateLastUpdatedDate(mockSet, identifier, storeName, winterDate);
    updateLastAccessedDate(mockSet, identifier, storeName, summerDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved winter date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved summer date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate.getTime() - lastUpdatedDate.getTime()).toBe(3600001); // 1 hour and 1 millisecond difference
  });

  it('should handle dates with different time zones', () => {
    log('\nTesting handling of dates with different time zones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const tokyoDate = new Date('2023-06-15T19:30:00+09:00'); // Tokyo time
    const losAngelesDate = new Date('2023-06-15T03:30:00-07:00'); // Los Angeles time

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: tokyoDate,
      lastAccessedDate: losAngelesDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved Tokyo date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved Los Angeles date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(lastAccessedDate.getTime());
  });

  it('should handle date comparisons across time zones', () => {
    log('\nTesting date comparisons across time zones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const earlierDate = new Date('2023-06-15T23:30:00+09:00'); // Tokyo time
    const laterDate = new Date('2023-06-15T10:30:00-04:00'); // New York time

    updateLastUpdatedDate(mockSet, identifier, storeName, earlierDate);
    updateLastAccessedDate(mockSet, identifier, storeName, laterDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved earlier date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved later date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate < lastAccessedDate).toBe(true);
  });

  it('should handle dates at the International Date Line', () => {
    log('\nTesting handling of dates at the International Date Line...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const westernDate = new Date('2023-06-15T23:59:59-12:00'); // Just west of IDL
    const easternDate = new Date('2023-06-16T00:00:00+12:00'); // Just east of IDL

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: westernDate,
      lastAccessedDate: easternDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved western date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved eastern date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(lastAccessedDate.getTime());
    expect(lastUpdatedDate.getUTCDate()).toBe(16);
    expect(lastAccessedDate.getUTCDate()).toBe(16);
  });

  it('should handle extreme time zone offsets', () => {
    log('\nTesting handling of extreme time zone offsets...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const extremeWestDate = new Date('2023-06-15T00:00:00-12:00'); // UTC-12
    const extremeEastDate = new Date('2023-06-15T23:59:59+14:00'); // UTC+14

    updateLastUpdatedDate(mockSet, identifier, storeName, extremeWestDate);
    updateLastAccessedDate(mockSet, identifier, storeName, extremeEastDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved extreme west date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved extreme east date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate.getTime() - lastUpdatedDate.getTime()).toBe(26 * 60 * 60 * 1000 - 1000); // 26 hours minus 1 second
  });

  it('should handle dates during leap seconds', () => {
    log('\nTesting handling of dates during leap seconds...');

    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: JavaScript doesn't natively support leap seconds, so we're simulating it
    const leapSecondDate = new Date('2016-12-31T23:59:59.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, leapSecondDate);

    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved leap second date: ${retrievedDate.toISOString()}`);

    expect(retrievedDate).toEqual(leapSecondDate);
  });

  it('should handle dates with fractional time zone offsets', () => {
    log('\nTesting handling of dates with fractional time zone offsets...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const fractionalOffsetDate = new Date('2023-06-15T12:00:00+05:30'); // India Standard Time

    updateLastAccessedDate(mockSet, identifier, storeName, fractionalOffsetDate);

    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved fractional offset date: ${retrievedDate.toISOString()}`);

    expect(retrievedDate.getUTCHours()).toBe(6);
    expect(retrievedDate.getUTCMinutes()).toBe(30);
  });

  it('should maintain UTC time when updating across time zones', () => {
    log('\nTesting maintenance of UTC time when updating across time zones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00Z');
    const updatedDate = new Date('2023-06-15T08:00:00-04:00'); // Same time as initial date, but in EDT

    updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);

    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved updated date: ${retrievedDate.toISOString()}`);

    expect(retrievedDate.getUTCHours()).toBe(12);
    expect(retrievedDate.getTime()).toBe(initialDate.getTime());
  });

  it('should handle time zone changes in daylight saving transitions', () => {
    log('\nTesting handling of time zone changes in daylight saving transitions...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const winterDate = new Date('2023-11-05T01:59:59-04:00'); // Just before DST ends
    const fallbackDate = new Date('2023-11-05T01:00:00-05:00'); // Just after DST ends

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: winterDate,
      lastAccessedDate: fallbackDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved winter date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved fallback date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate.getTime() - lastUpdatedDate.getTime()).toBe(3600000); // 1 hour difference
  });
});
