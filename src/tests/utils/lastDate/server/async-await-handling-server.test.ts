import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('async-await-handling-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Async/Await Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Async/Await Handling tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle async get and set operations for last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle async get and set operations for last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle async operations for getting both dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T09:00:00.000Z');
    const accessedDate = new Date('2023-06-17T09:01:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle async operations with default date values', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    await updateLastDates(mockSet, identifier, storeName);
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);
    const after = new Date();

    log(`Retrieved default last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved default last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDates.lastUpdatedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(retrievedDates.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDates.lastAccessedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle async operations for multiple identifiers', async () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-18T11:30:00.000Z');
    const date2 = new Date('2023-06-19T13:45:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const retrievedDate1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const retrievedDate2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should handle async operations for non-existent keys', async () => {
    const identifier = 'nonExistentId';
    const storeName = 'nonExistentStore';

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for non-existent key: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle async operations with invalid date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after invalid input: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle async operations with concurrent updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-20T10:00:00.000Z');
    const date2 = new Date('2023-06-20T10:01:00.000Z');

    await Promise.all([
      updateLastUpdatedDate(mockSet, identifier, storeName, date1),
      updateLastUpdatedDate(mockSet, identifier, storeName, date2),
    ]);

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after concurrent updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date2);
  });
});
