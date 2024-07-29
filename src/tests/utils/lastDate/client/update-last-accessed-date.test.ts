import { getLastAccessedDate, updateLastAccessedDate } from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-accessed-date-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Update Last Accessed Date', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Update Last Accessed Date tests...');
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

  it('should update last accessed date correctly', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Updated and retrieved last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should overwrite existing last accessed date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const newDate = new Date('2023-06-16T14:45:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    updateLastAccessedDate(mockSet, identifier, storeName, newDate);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved overwritten last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(newDate);
  });

  it('should handle updating with current date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    updateLastAccessedDate(mockSet, identifier, storeName, new Date());
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);
    const after = new Date();

    log(`Retrieved current last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should update last accessed date for different identifiers independently', () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-17T09:00:00.000Z');
    const date2 = new Date('2023-06-18T11:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier1, storeName, date1);
    updateLastAccessedDate(mockSet, identifier2, storeName, date2);

    const retrievedDate1 = getLastAccessedDate(mockGet, identifier1, storeName);
    const retrievedDate2 = getLastAccessedDate(mockGet, identifier2, storeName);

    log(`Retrieved last accessed date for identifier1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last accessed date for identifier2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should update last accessed date for different store names independently', () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-19T13:15:00.000Z');
    const date2 = new Date('2023-06-20T15:00:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const retrievedDate1 = getLastAccessedDate(mockGet, identifier, storeName1);
    const retrievedDate2 = getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for storeName1: ${retrievedDate1.toISOString()}`);
    log(`Retrieved last accessed date for storeName2: ${retrievedDate2.toISOString()}`);
    expect(retrievedDate1).toEqual(date1);
    expect(retrievedDate2).toEqual(date2);
  });

  it('should handle updating with invalid date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after invalid update: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(new Date(0));
  });

  it('should handle updating with future date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureDate = new Date('2100-01-01T00:00:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, futureDate);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved future last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(futureDate);
  });

  it('should handle updating with past date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pastDate = new Date('1970-01-01T00:00:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, pastDate);
    const retrievedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved past last accessed date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(pastDate);
  });
});
