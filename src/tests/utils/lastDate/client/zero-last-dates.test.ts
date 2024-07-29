import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('zero-last-dates-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Zero Last Dates', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Zero Last Dates tests...');
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

  it('should return zero date for non-existent last updated date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved non-existent last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should return zero date for non-existent last accessed date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved non-existent last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should return zero dates for non-existent last dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved non-existent last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved non-existent last accessed date: ${lastAccessedDate.toISOString()}`);
    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should allow setting zero as last updated date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);

    updateLastUpdatedDate(mockSet, identifier, storeName, zeroDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved zero last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(zeroDate);
  });

  it('should allow setting zero as last accessed date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);

    updateLastAccessedDate(mockSet, identifier, storeName, zeroDate);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved zero last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(zeroDate);
  });

  it('should allow setting zero for both last updated and last accessed dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: zeroDate,
      lastAccessedDate: zeroDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved zero last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved zero last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(zeroDate);
    expect(retrievedDates.lastAccessedDate).toEqual(zeroDate);
  });

  it('should handle transition from zero to non-zero date for last updated date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const nonZeroDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, zeroDate);
    let retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved initial zero last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(zeroDate);

    updateLastUpdatedDate(mockSet, identifier, storeName, nonZeroDate);
    retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved non-zero last updated date after transition: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(nonZeroDate);
  });

  it('should handle transition from zero to non-zero date for last accessed date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const nonZeroDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, zeroDate);
    let retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved initial zero last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(zeroDate);

    updateLastAccessedDate(mockSet, identifier, storeName, nonZeroDate);
    retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved non-zero last accessed date after transition: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(nonZeroDate);
  });

  it('should handle transition from non-zero to zero date for both dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nonZeroDate = new Date('2023-06-15T10:30:00.000Z');
    const zeroDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: nonZeroDate,
      lastAccessedDate: nonZeroDate,
    });
    let retrievedDates = getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved initial non-zero dates: ${retrievedDates.lastUpdatedDate.toISOString()}, ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(nonZeroDate);
    expect(retrievedDates.lastAccessedDate).toEqual(nonZeroDate);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: zeroDate,
      lastAccessedDate: zeroDate,
    });
    retrievedDates = getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved zero dates after transition: ${retrievedDates.lastUpdatedDate.toISOString()}, ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(zeroDate);
    expect(retrievedDates.lastAccessedDate).toEqual(zeroDate);
  });

  it('should handle setting zero date for one field and non-zero for another', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const nonZeroDate = new Date('2023-06-16T14:45:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: zeroDate,
      lastAccessedDate: nonZeroDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved mixed zero and non-zero dates: ${retrievedDates.lastUpdatedDate.toISOString()}, ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(zeroDate);
    expect(retrievedDates.lastAccessedDate).toEqual(nonZeroDate);
  });

  it('should handle comparison between zero and non-zero dates', () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const nonZeroDate = new Date('2023-06-17T09:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier1, storeName, zeroDate);
    updateLastUpdatedDate(mockSet, identifier2, storeName, nonZeroDate);

    const retrievedDate1 = getLastUpdatedDate(mockGet, identifier1, storeName);
    const retrievedDate2 = getLastUpdatedDate(mockGet, identifier2, storeName);

    log(
      `Comparing zero date: ${retrievedDate1.toISOString()} with non-zero date: ${retrievedDate2.toISOString()}`,
    );
    expect(retrievedDate1 < retrievedDate2).toBe(true);
  });

  it('should handle multiple updates between zero and non-zero dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const nonZeroDate1 = new Date('2023-06-18T11:30:00.000Z');
    const nonZeroDate2 = new Date('2023-06-19T13:45:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, zeroDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, nonZeroDate1);
    updateLastUpdatedDate(mockSet, identifier, storeName, zeroDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, nonZeroDate2);

    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after multiple zero and non-zero updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(nonZeroDate2);
  });

  it('should handle zero dates with different timezones', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDateUTC = new Date('1970-01-01T00:00:00.000Z');
    const zeroDateEST = new Date('1969-12-31T19:00:00.000-05:00');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: zeroDateUTC,
      lastAccessedDate: zeroDateEST,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved zero dates with different timezones: ${retrievedDates.lastUpdatedDate.toISOString()}, ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(zeroDateUTC);
    expect(retrievedDates.lastAccessedDate).toEqual(zeroDateUTC); // Should be converted to UTC
  });

  it('should handle zero date in leap years', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const zeroDate = new Date(0);
    const leapYearDate = new Date('2024-02-29T00:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: zeroDate,
      lastAccessedDate: leapYearDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved zero date and leap year date: ${retrievedDates.lastUpdatedDate.toISOString()}, ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(zeroDate);
    expect(retrievedDates.lastAccessedDate).toEqual(leapYearDate);
  });
});
