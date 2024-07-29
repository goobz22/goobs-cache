import {
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('get-last-dates-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Get Last Dates', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Get Last Dates tests...');
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

  it('should return default dates when no dates have been set', () => {
    log('\nTesting getting last dates when no dates have been set...');

    const identifier = 'testId';
    const storeName = 'testStore';

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should return correct dates after setting them individually', () => {
    log('\nTesting getting last dates after setting them individually...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:30:00.000Z');
    const accessedDate = new Date('2023-06-16T14:45:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);
    updateLastAccessedDate(mockSet, identifier, storeName, accessedDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(updatedDate);
    expect(lastAccessedDate).toEqual(accessedDate);
  });

  it('should return correct dates after setting them together', () => {
    log('\nTesting getting last dates after setting them together...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T09:15:00.000Z');
    const accessedDate = new Date('2023-06-17T11:30:00.000Z');

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

  it('should return correct dates for different identifiers', () => {
    log('\nTesting getting last dates for different identifiers...');

    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const updatedDate1 = new Date('2023-06-18T09:15:00.000Z');
    const accessedDate1 = new Date('2023-06-18T11:30:00.000Z');
    const updatedDate2 = new Date('2023-06-19T13:45:00.000Z');
    const accessedDate2 = new Date('2023-06-19T15:00:00.000Z');

    updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: updatedDate1,
      lastAccessedDate: accessedDate1,
    });
    updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: updatedDate2,
      lastAccessedDate: accessedDate2,
    });

    const dates1 = getLastDates(mockGet, identifier1, storeName);
    const dates2 = getLastDates(mockGet, identifier2, storeName);

    log(
      `Retrieved dates for ${identifier1} - Last Updated: ${dates1.lastUpdatedDate.toISOString()}, Last Accessed: ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for ${identifier2} - Last Updated: ${dates2.lastUpdatedDate.toISOString()}, Last Accessed: ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(updatedDate1);
    expect(dates1.lastAccessedDate).toEqual(accessedDate1);
    expect(dates2.lastUpdatedDate).toEqual(updatedDate2);
    expect(dates2.lastAccessedDate).toEqual(accessedDate2);
  });

  it('should return correct dates for different store names', () => {
    log('\nTesting getting last dates for different store names...');

    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const updatedDate1 = new Date('2023-06-20T09:15:00.000Z');
    const accessedDate1 = new Date('2023-06-20T11:30:00.000Z');
    const updatedDate2 = new Date('2023-06-21T13:45:00.000Z');
    const accessedDate2 = new Date('2023-06-21T15:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: updatedDate1,
      lastAccessedDate: accessedDate1,
    });
    updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: updatedDate2,
      lastAccessedDate: accessedDate2,
    });

    const dates1 = getLastDates(mockGet, identifier, storeName1);
    const dates2 = getLastDates(mockGet, identifier, storeName2);

    log(
      `Retrieved dates for ${storeName1} - Last Updated: ${dates1.lastUpdatedDate.toISOString()}, Last Accessed: ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for ${storeName2} - Last Updated: ${dates2.lastUpdatedDate.toISOString()}, Last Accessed: ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(updatedDate1);
    expect(dates1.lastAccessedDate).toEqual(accessedDate1);
    expect(dates2.lastUpdatedDate).toEqual(updatedDate2);
    expect(dates2.lastAccessedDate).toEqual(accessedDate2);
  });
});
