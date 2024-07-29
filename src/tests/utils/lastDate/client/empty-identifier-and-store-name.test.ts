import {
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('empty-identifier-and-store-name-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Empty Identifier and Store Name', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Empty Identifier and Store Name tests...');
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

  it('should handle empty identifier', () => {
    log('\nTesting with empty identifier...');

    const emptyIdentifier = '';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, emptyIdentifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, emptyIdentifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle empty store name', () => {
    log('\nTesting with empty store name...');

    const identifier = 'testId';
    const emptyStoreName = '';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, emptyStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, emptyStoreName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle both empty identifier and store name', () => {
    log('\nTesting with both empty identifier and store name...');

    const emptyIdentifier = '';
    const emptyStoreName = '';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, emptyIdentifier, emptyStoreName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockGet,
      emptyIdentifier,
      emptyStoreName,
    );
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle updating with empty identifier', () => {
    log('\nTesting updating with empty identifier...');

    const emptyIdentifier = '';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, emptyIdentifier, storeName, date);
    updateLastAccessedDate(mockSet, emptyIdentifier, storeName, date);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, emptyIdentifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle updating with empty store name', () => {
    log('\nTesting updating with empty store name...');

    const identifier = 'testId';
    const emptyStoreName = '';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, emptyStoreName, date);
    updateLastAccessedDate(mockSet, identifier, emptyStoreName, date);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, emptyStoreName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle updating with both empty identifier and store name', () => {
    log('\nTesting updating with both empty identifier and store name...');

    const emptyIdentifier = '';
    const emptyStoreName = '';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, emptyIdentifier, emptyStoreName, date);
    updateLastAccessedDate(mockSet, emptyIdentifier, emptyStoreName, date);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockGet,
      emptyIdentifier,
      emptyStoreName,
    );
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
    expect(lastAccessedDate).toEqual(date);
  });
});
