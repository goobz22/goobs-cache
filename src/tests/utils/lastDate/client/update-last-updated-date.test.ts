import { getLastUpdatedDate, updateLastUpdatedDate } from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-updated-date-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Update Last Updated Date', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Update Last Updated Date tests...');
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

  it('should update last updated date correctly', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Updated and retrieved last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should overwrite existing last updated date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const newDate = new Date('2023-06-16T14:45:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, newDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved overwritten last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(newDate);
  });

  it('should handle updating with current date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    updateLastUpdatedDate(mockSet, identifier, storeName, new Date());
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const after = new Date();

    log(`Retrieved current last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should update last updated date for different identifiers independently', () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-17T09:00:00.000Z');
    const date2 = new Date('2023-06-18T11:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const retrievedDate1 = getLastUpdatedDate(mockGet, identifier1, storeName);
    const retrievedDate2 = getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should update last updated date for different store names independently', () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-19T13:15:00.000Z');
    const date2 = new Date('2023-06-20T15:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName1, date1);
    updateLastUpdatedDate(mockSet, identifier, storeName2, date2);

    const retrievedDate1 = getLastUpdatedDate(mockGet, identifier, storeName1);
    const retrievedDate2 = getLastUpdatedDate(mockGet, identifier, storeName2);

    log(`Retrieved last updated date for storeName1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last updated date for storeName2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should handle updating with invalid date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after invalid update: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle updating with future date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureDate = new Date('2100-01-01T00:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, futureDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved future last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(futureDate);
  });

  it('should handle updating with past date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pastDate = new Date('1970-01-01T00:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, pastDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved past last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(pastDate);
  });

  it('should handle updating with date having different timezone', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-22T10:00:00+02:00');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date with timezone: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.toUTCString()).toEqual(date.toUTCString());
  });

  it('should handle updating with millisecond precision', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-22T10:30:00.123Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date with millisecond precision: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
    expect(retrievedDate.getMilliseconds()).toBe(123);
  });

  it('should handle updating with leap year date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const leapYearDate = new Date('2024-02-29T12:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, leapYearDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date for leap year: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(leapYearDate);
    expect(retrievedDate.getUTCMonth()).toBe(1); // February
    expect(retrievedDate.getUTCDate()).toBe(29);
  });

  it('should handle updating with daylight saving time transition', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // This date is during daylight saving time transition in many timezones
    const dstDate = new Date('2023-03-12T02:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, dstDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date during DST transition: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(dstDate);
  });

  it('should handle updating with Unix epoch', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0); // Unix epoch

    updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date for Unix epoch: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(epochDate);
    expect(retrievedDate.getTime()).toBe(0);
  });

  it('should handle updating with maximum representable date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000); // Maximum date value in JavaScript

    updateLastUpdatedDate(mockSet, identifier, storeName, maxDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved maximum representable last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(maxDate);
  });

  it('should handle updating with date just before maximum representable date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const almostMaxDate = new Date(8640000000000000 - 1); // 1 millisecond before maximum date

    updateLastUpdatedDate(mockSet, identifier, storeName, almostMaxDate);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date just before maximum: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(almostMaxDate);
    expect(retrievedDate.getTime()).toBe(8640000000000000 - 1);
  });

  it('should handle multiple rapid updates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dates = [
      new Date('2023-06-23T10:00:00.000Z'),
      new Date('2023-06-23T10:00:00.001Z'),
      new Date('2023-06-23T10:00:00.002Z'),
      new Date('2023-06-23T10:00:00.003Z'),
      new Date('2023-06-23T10:00:00.004Z'),
    ];

    dates.forEach((date) => updateLastUpdatedDate(mockSet, identifier, storeName, date));
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after multiple rapid updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(dates[dates.length - 1]);
  });
});
