import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-persistence-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Persistence', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Persistence tests...');
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

  it('should persist updated date', () => {
    log('\nTesting persistence of updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);

    const persistedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted updated date: ${persistedDate.toISOString()}`);

    expect(persistedDate).toEqual(date);
  });

  it('should persist accessed date', () => {
    log('\nTesting persistence of accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T11:45:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, date);

    const persistedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted accessed date: ${persistedDate.toISOString()}`);

    expect(persistedDate).toEqual(date);
  });

  it('should persist both dates when updated together', () => {
    log('\nTesting persistence of both dates when updated together...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-16T09:00:00.000Z');
    const accessedDate = new Date('2023-06-16T09:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const persistedDates = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved persisted updated date: ${persistedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved persisted accessed date: ${persistedDates.lastAccessedDate.toISOString()}`);

    expect(persistedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(persistedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should maintain persistence across multiple updates', () => {
    log('\nTesting persistence across multiple updates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-17T10:00:00.000Z');
    const date2 = new Date('2023-06-17T11:00:00.000Z');
    const date3 = new Date('2023-06-17T12:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    updateLastUpdatedDate(mockSet, identifier, storeName, date2);
    updateLastUpdatedDate(mockSet, identifier, storeName, date3);

    const persistedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted updated date after multiple updates: ${persistedDate.toISOString()}`);

    expect(persistedDate).toEqual(date3);
  });

  it('should persist dates for different identifiers separately', () => {
    log('\nTesting persistence for different identifiers...');

    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-18T09:00:00.000Z');
    const date2 = new Date('2023-06-18T10:00:00.000Z');

    updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const persistedDate1 = getLastUpdatedDate(mockGet, identifier1, storeName);
    const persistedDate2 = getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved persisted date for identifier1: ${persistedDate1.toISOString()}`);
    log(`Retrieved persisted date for identifier2: ${persistedDate2.toISOString()}`);

    expect(persistedDate1).toEqual(date1);
    expect(persistedDate2).toEqual(date2);
  });

  it('should persist dates for different store names separately', () => {
    log('\nTesting persistence for different store names...');

    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-19T09:00:00.000Z');
    const date2 = new Date('2023-06-19T10:00:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const persistedDate1 = getLastAccessedDate(mockGet, identifier, storeName1);
    const persistedDate2 = getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved persisted date for storeName1: ${persistedDate1.toISOString()}`);
    log(`Retrieved persisted date for storeName2: ${persistedDate2.toISOString()}`);

    expect(persistedDate1).toEqual(date1);
    expect(persistedDate2).toEqual(date2);
  });

  it('should maintain persistence after retrieving dates', () => {
    log('\nTesting persistence after retrieving dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-20T09:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });

    getLastDates(mockGet, identifier, storeName);
    getLastDates(mockGet, identifier, storeName);

    const persistedDates = getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved persisted updated date after multiple gets: ${persistedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved persisted accessed date after multiple gets: ${persistedDates.lastAccessedDate.toISOString()}`,
    );

    expect(persistedDates.lastUpdatedDate).toEqual(date);
    expect(persistedDates.lastAccessedDate).toEqual(date);
  });

  it('should persist dates with millisecond precision', () => {
    log('\nTesting persistence of dates with millisecond precision...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-21T09:00:00.123Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);

    const persistedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted date with milliseconds: ${persistedDate.toISOString()}`);

    expect(persistedDate.getMilliseconds()).toBe(123);
    expect(persistedDate).toEqual(date);
  });

  it('should handle persistence of invalid dates', () => {
    log('\nTesting persistence of invalid dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('Invalid Date');

    updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);

    const persistedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted invalid date: ${persistedDate.toISOString()}`);

    expect(persistedDate).toEqual(new Date(0));
  });

  it('should maintain persistence across simulated app restarts', () => {
    log('\nTesting persistence across simulated app restarts...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-22T09:00:00.000Z');
    const newDate = new Date('2023-06-22T10:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    // Simulate app restart by creating new mock functions
    const newMockGet = (key: string): string | null => mockStorage[key] || null;
    const newMockSet = (key: string, value: string): void => {
      mockStorage[key] = value;
    };

    // Verify initial persistence
    let persistedDates = getLastDates(newMockGet, identifier, storeName);
    log(
      `Retrieved persisted updated date after restart: ${persistedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved persisted accessed date after restart: ${persistedDates.lastAccessedDate.toISOString()}`,
    );

    expect(persistedDates.lastUpdatedDate).toEqual(initialDate);
    expect(persistedDates.lastAccessedDate).toEqual(initialDate);

    // Use newMockSet to update dates
    updateLastDates(newMockSet, identifier, storeName, {
      lastUpdatedDate: newDate,
      lastAccessedDate: newDate,
    });

    // Verify persistence after update with new mock functions
    persistedDates = getLastDates(newMockGet, identifier, storeName);
    log(
      `Retrieved persisted updated date after new update: ${persistedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved persisted accessed date after new update: ${persistedDates.lastAccessedDate.toISOString()}`,
    );

    expect(persistedDates.lastUpdatedDate).toEqual(newDate);
    expect(persistedDates.lastAccessedDate).toEqual(newDate);
  });

  it('should handle persistence with very large dates', () => {
    log('\nTesting persistence with very large dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const largeDate = new Date(8640000000000000); // Maximum date value

    updateLastUpdatedDate(mockSet, identifier, storeName, largeDate);

    const persistedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved persisted large date: ${persistedDate.toISOString()}`);

    expect(persistedDate).toEqual(largeDate);
  });

  it('should maintain persistence when updating only one date', () => {
    log('\nTesting persistence when updating only one date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-23T09:00:00.000Z');
    const updatedDate = new Date('2023-06-23T10:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);

    const persistedDates = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved persisted updated date: ${persistedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved persisted accessed date: ${persistedDates.lastAccessedDate.toISOString()}`);

    expect(persistedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(persistedDates.lastAccessedDate).toEqual(initialDate);
  });
});
