import { getLastDates, updateLastDates } from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('date-format-handling-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Format Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Format Handling tests...');
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

  it('should handle valid ISO 8601 date strings', () => {
    log('\nTesting handling of valid ISO 8601 date strings...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const isoDate = '2023-06-15T10:30:00.000Z';

    mockStorage[`${identifier}:${storeName}:lastUpdated`] = isoDate;
    mockStorage[`${identifier}:${storeName}:lastAccessed`] = isoDate;

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(isoDate));
    expect(lastAccessedDate).toEqual(new Date(isoDate));
  });

  it('should handle valid RFC 2822 date strings', () => {
    log('\nTesting handling of valid RFC 2822 date strings...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const rfcDate = 'Thu, 15 Jun 2023 10:30:00 GMT';

    mockStorage[`${identifier}:${storeName}:lastUpdated`] = rfcDate;
    mockStorage[`${identifier}:${storeName}:lastAccessed`] = rfcDate;

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(rfcDate));
    expect(lastAccessedDate).toEqual(new Date(rfcDate));
  });

  it('should handle invalid date strings', () => {
    log('\nTesting handling of invalid date strings...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = 'invalid date string';

    mockStorage[`${identifier}:${storeName}:lastUpdated`] = invalidDate;
    mockStorage[`${identifier}:${storeName}:lastAccessed`] = invalidDate;

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle date strings with different timezones', () => {
    log('\nTesting handling of date strings with different timezones...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const utcDate = '2023-06-15T10:30:00.000Z';
    const nycDate = '2023-06-15T06:30:00.000-04:00';

    mockStorage[`${identifier}:${storeName}:lastUpdated`] = utcDate;
    mockStorage[`${identifier}:${storeName}:lastAccessed`] = nycDate;

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(utcDate));
    expect(lastAccessedDate).toEqual(new Date(nycDate));
  });

  it('should handle updating with JavaScript Date objects', () => {
    log('\nTesting handling of updating with JavaScript Date objects...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const jsDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: jsDate,
      lastAccessedDate: jsDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(jsDate);
    expect(lastAccessedDate).toEqual(jsDate);
  });

  it('should handle updating with Unix timestamps', () => {
    log('\nTesting handling of updating with Unix timestamps...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const timestamp = 1686826200000; // 2023-06-15T10:30:00.000Z

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: new Date(timestamp),
      lastAccessedDate: new Date(timestamp),
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(timestamp));
    expect(lastAccessedDate).toEqual(new Date(timestamp));
  });
});
