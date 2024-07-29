import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('invalid-input-handling-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Invalid Input Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Invalid Input Handling tests...');
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

  it('should handle null identifier', () => {
    log('\nTesting with null identifier...');

    const nullIdentifier = null as unknown as string;
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, nullIdentifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, nullIdentifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle undefined store name', () => {
    log('\nTesting with undefined store name...');

    const identifier = 'testId';
    const undefinedStoreName = undefined as unknown as string;
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, undefinedStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockGet,
      identifier,
      undefinedStoreName,
    );
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle invalid date input', () => {
    log('\nTesting with invalid date input...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = 'not a date' as unknown as Date;

    updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle non-string identifier', () => {
    log('\nTesting with non-string identifier...');

    const nonStringIdentifier = 123 as unknown as string;
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, nonStringIdentifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockGet,
      nonStringIdentifier,
      storeName,
    );
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle non-string store name', () => {
    log('\nTesting with non-string store name...');

    const identifier = 'testId';
    const nonStringStoreName = 456 as unknown as string;
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, nonStringStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockGet,
      identifier,
      nonStringStoreName,
    );
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle invalid get function', () => {
    log('\nTesting with invalid get function...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidGet = null as unknown as (key: string) => string | null;

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(invalidGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle invalid set function', () => {
    log('\nTesting with invalid set function...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');
    const invalidSet = null as unknown as (key: string, value: string) => void;

    updateLastDates(invalidSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });
});
