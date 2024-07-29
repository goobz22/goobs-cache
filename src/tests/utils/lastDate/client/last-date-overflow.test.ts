import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-overflow-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Overflow', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Overflow tests...');
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

  it('should handle maximum date value', () => {
    log('\nTesting handling of maximum date value...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000); // Maximum date value in JavaScript

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: maxDate,
      lastAccessedDate: maxDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(maxDate);
    expect(lastAccessedDate).toEqual(maxDate);
  });

  it('should handle minimum date value', () => {
    log('\nTesting handling of minimum date value...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const minDate = new Date(-8640000000000000); // Minimum date value in JavaScript

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: minDate,
      lastAccessedDate: minDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(minDate);
    expect(lastAccessedDate).toEqual(minDate);
  });

  it('should handle date value exceeding maximum', () => {
    log('\nTesting handling of date value exceeding maximum...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const overflowDate = new Date(8640000000000001); // Exceeds maximum date value

    updateLastUpdatedDate(mockSet, identifier, storeName, overflowDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBe(8640000000000000);
  });

  it('should handle date value below minimum', () => {
    log('\nTesting handling of date value below minimum...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const underflowDate = new Date(-8640000000000001); // Below minimum date value

    updateLastAccessedDate(mockSet, identifier, storeName, underflowDate);

    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate.getTime()).toBe(-8640000000000000);
  });

  it('should handle transition from valid to invalid date', () => {
    log('\nTesting transition from valid to invalid date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-06-15T10:30:00.000Z');
    const invalidDate = new Date('Invalid Date');

    updateLastUpdatedDate(mockSet, identifier, storeName, validDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(validDate);
  });

  it('should handle very large time differences', () => {
    log('\nTesting handling of very large time differences...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const pastDate = new Date(-271821600000000); // Approximately year 6380 BC
    const futureDate = new Date(253402300799999); // Year 9999

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: pastDate,
      lastAccessedDate: futureDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(pastDate);
    expect(lastAccessedDate).toEqual(futureDate);
    expect(lastAccessedDate.getTime() - lastUpdatedDate.getTime()).toBe(525223900799999);
  });

  it('should handle date overflow during calculations', () => {
    log('\nTesting date overflow during calculations...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000);
    const almostMaxDate = new Date(8639999999999999);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: almostMaxDate,
      lastAccessedDate: maxDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    const timeDifference = lastAccessedDate.getTime() - lastUpdatedDate.getTime();
    log(`Time difference: ${timeDifference} milliseconds`);

    expect(timeDifference).toBe(1);
    expect(() => new Date(lastAccessedDate.getTime() + 1)).toThrow();
  });
});
