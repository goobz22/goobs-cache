import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('basic-last-date-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Basic Functionality', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Basic Functionality tests...');
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

  it('should update and retrieve last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should update and retrieve last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should update and retrieve both dates', async () => {
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

  it('should handle non-existent keys', async () => {
    const identifier = 'nonExistentId';
    const storeName = 'nonExistentStore';

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for non-existent key: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should update dates with current time when no date is provided', async () => {
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

  it('should handle multiple updates to the same key', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-18T11:30:00.000Z');
    const date2 = new Date('2023-06-18T11:45:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, date2);

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after multiple updates: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date2);
  });

  it('should handle different identifiers independently', async () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-19T13:00:00.000Z');
    const date2 = new Date('2023-06-19T14:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const retrievedDate1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const retrievedDate2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should handle different store names independently', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-20T15:00:00.000Z');
    const date2 = new Date('2023-06-20T16:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const retrievedDate1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const retrievedDate2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for storeName1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last accessed date for storeName2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should handle updating only lastUpdatedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-21T10:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(retrievedDates.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should handle updating only lastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const accessedDate = new Date('2023-06-22T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(new Date(0));
    expect(retrievedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle invalid date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after invalid input: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle dates with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-23T12:34:56.789Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with millisecond precision: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
    expect(retrievedDate.getMilliseconds()).toBe(789);
  });

  it('should handle updating and retrieving dates across day boundaries', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-30T23:59:59.999Z');
    const date2 = new Date('2023-07-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName, date2);

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(date1);
    expect(retrievedDates.lastAccessedDate).toEqual(date2);
    expect(
      retrievedDates.lastAccessedDate.getTime() - retrievedDates.lastUpdatedDate.getTime(),
    ).toBe(1);
  });

  it('should handle updating with the same date multiple times', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-24T12:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after multiple updates with the same date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });
});
