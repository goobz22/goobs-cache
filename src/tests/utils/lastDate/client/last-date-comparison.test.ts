import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-comparison-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Comparison', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Comparison tests...');
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

  it('should correctly compare updated and accessed dates', () => {
    log('\nTesting comparison of updated and accessed dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:30:00.000Z');
    const accessedDate = new Date('2023-06-15T11:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate < lastAccessedDate).toBe(true);
    expect(lastAccessedDate > lastUpdatedDate).toBe(true);
  });

  it('should handle equal updated and accessed dates', () => {
    log('\nTesting equal updated and accessed dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const sameDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: sameDate,
      lastAccessedDate: sameDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(lastAccessedDate.getTime());
  });

  it('should compare dates across different identifiers', () => {
    log('\nTesting date comparison across different identifiers...');

    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-16T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const lastUpdatedDate1 = getLastUpdatedDate(mockGet, identifier1, storeName);
    const lastUpdatedDate2 = getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for ${identifier1}: ${lastUpdatedDate1.toISOString()}`);
    log(`Retrieved last updated date for ${identifier2}: ${lastUpdatedDate2.toISOString()}`);

    expect(lastUpdatedDate1 < lastUpdatedDate2).toBe(true);
    expect(lastUpdatedDate2 > lastUpdatedDate1).toBe(true);
  });

  it('should compare dates across different store names', () => {
    log('\nTesting date comparison across different store names...');

    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-16T10:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const lastAccessedDate1 = getLastAccessedDate(mockGet, identifier, storeName1);
    const lastAccessedDate2 = getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for ${storeName1}: ${lastAccessedDate1.toISOString()}`);
    log(`Retrieved last accessed date for ${storeName2}: ${lastAccessedDate2.toISOString()}`);

    expect(lastAccessedDate1 < lastAccessedDate2).toBe(true);
    expect(lastAccessedDate2 > lastAccessedDate1).toBe(true);
  });

  it('should handle millisecond precision in date comparison', () => {
    log('\nTesting millisecond precision in date comparison...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T10:30:00.001Z');
    const date2 = new Date('2023-06-15T10:30:00.002Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    updateLastAccessedDate(mockSet, identifier, storeName, date2);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate < lastAccessedDate).toBe(true);
    expect(lastAccessedDate > lastUpdatedDate).toBe(true);
    expect(lastAccessedDate.getTime() - lastUpdatedDate.getTime()).toBe(1);
  });

  it('should compare dates after multiple updates', () => {
    log('\nTesting date comparison after multiple updates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-15T11:30:00.000Z');
    const date3 = new Date('2023-06-15T12:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    updateLastAccessedDate(mockSet, identifier, storeName, date2);
    updateLastUpdatedDate(mockSet, identifier, storeName, date3);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate > lastAccessedDate).toBe(true);
    expect(lastUpdatedDate).toEqual(date3);
    expect(lastAccessedDate).toEqual(date2);
  });

  it('should handle date comparisons with default dates', () => {
    log('\nTesting date comparisons with default dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const defaultDate = new Date(0);
    const updateDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, updateDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate > lastAccessedDate).toBe(true);
    expect(lastUpdatedDate).toEqual(updateDate);
    expect(lastAccessedDate).toEqual(defaultDate);
  });

  it('should compare dates across different timezones', () => {
    log('\nTesting date comparisons across different timezones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const dateUTC = new Date('2023-06-15T10:30:00.000Z');
    const dateEST = new Date('2023-06-15T06:30:00.000-04:00');

    updateLastUpdatedDate(mockSet, identifier, storeName, dateUTC);
    updateLastAccessedDate(mockSet, identifier, storeName, dateEST);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date (UTC): ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date (EST): ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(lastAccessedDate.getTime());
  });

  it('should handle date comparisons with future dates', () => {
    log('\nTesting date comparisons with future dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const pastDate = new Date('2023-06-15T10:30:00.000Z');
    const futureDate = new Date('2025-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, pastDate);
    updateLastAccessedDate(mockSet, identifier, storeName, futureDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate < lastAccessedDate).toBe(true);
    expect(lastAccessedDate > new Date()).toBe(true);
  });
});
