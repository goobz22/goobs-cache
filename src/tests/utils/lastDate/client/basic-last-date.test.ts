import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('basic-last-date-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities tests...');
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

  it('should handle updating and getting last updated date', () => {
    log('\nTesting updating and getting last updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(date);
  });

  it('should handle updating and getting last accessed date', () => {
    log('\nTesting updating and getting last accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00Z');

    updateLastAccessedDate(mockSet, identifier, storeName, date);

    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate).toEqual(date);
  });

  it('should handle getting last dates using getLastDates', () => {
    log('\nTesting getting last dates using getLastDates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T09:15:00Z');
    const accessedDate = new Date('2023-06-17T11:30:00Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);
    updateLastAccessedDate(mockSet, identifier, storeName, accessedDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(updatedDate);
    expect(lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle updating both dates using updateLastDates', () => {
    log('\nTesting updating both dates using updateLastDates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-18T09:15:00Z');
    const accessedDate = new Date('2023-06-18T11:30:00Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(updatedDate);
    expect(lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle getting last dates for non-existent keys', () => {
    log('\nTesting getting last dates for non-existent keys...');

    const identifier = 'nonExistentId';
    const storeName = 'nonExistentStore';

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle updating last accessed date only using updateLastDates', () => {
    log('\nTesting updating last accessed date only using updateLastDates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const accessedDate = new Date('2023-06-19T11:30:00Z');

    updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(accessedDate);
  });
});
