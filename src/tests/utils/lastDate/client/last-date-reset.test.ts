import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-reset-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Reset', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Reset tests...');
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

  it('should reset last updated date to epoch', () => {
    log('\nTesting reset of last updated date to epoch...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);

    const resetDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${resetDate.toISOString()}`);

    expect(resetDate).toEqual(epochDate);
  });

  it('should reset last accessed date to epoch', () => {
    log('\nTesting reset of last accessed date to epoch...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    updateLastAccessedDate(mockSet, identifier, storeName, epochDate);

    const resetDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved reset accessed date: ${resetDate.toISOString()}`);

    expect(resetDate).toEqual(epochDate);
  });

  it('should reset both dates to epoch', () => {
    log('\nTesting reset of both dates to epoch...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved reset accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(epochDate);
    expect(lastAccessedDate).toEqual(epochDate);
  });

  it('should handle undefined input for last updated date', () => {
    log('\nTesting handling of undefined input for last updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    updateLastUpdatedDate(mockSet, identifier, storeName, undefined);

    const resetDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${resetDate.toISOString()}`);

    expect(resetDate).toEqual(new Date(0));
  });

  it('should handle null-like input for last updated date', () => {
    log('\nTesting handling of null-like input for last updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    // Using a type assertion to simulate null-like behavior
    updateLastUpdatedDate(mockSet, identifier, storeName, null as unknown as Date);

    const resetDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${resetDate.toISOString()}`);

    expect(resetDate).toEqual(new Date(0));
  });

  it('should handle undefined input for last accessed date', () => {
    log('\nTesting handling of undefined input for last accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    updateLastAccessedDate(mockSet, identifier, storeName, undefined);

    const resetDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved reset accessed date: ${resetDate.toISOString()}`);

    expect(resetDate).toEqual(new Date(0));
  });

  it('should reset dates for specific identifier', () => {
    log('\nTesting reset of dates for specific identifier...');

    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const dates1 = getLastDates(mockGet, identifier1, storeName);
    const dates2 = getLastDates(mockGet, identifier2, storeName);

    log(
      `Retrieved reset dates for identifier1: ${dates1.lastUpdatedDate.toISOString()}, ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for identifier2: ${dates2.lastUpdatedDate.toISOString()}, ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(epochDate);
    expect(dates1.lastAccessedDate).toEqual(epochDate);
    expect(dates2.lastUpdatedDate).toEqual(initialDate);
    expect(dates2.lastAccessedDate).toEqual(initialDate);
  });

  it('should reset dates for specific store name', () => {
    log('\nTesting reset of dates for specific store name...');

    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const dates1 = getLastDates(mockGet, identifier, storeName1);
    const dates2 = getLastDates(mockGet, identifier, storeName2);

    log(
      `Retrieved reset dates for storeName1: ${dates1.lastUpdatedDate.toISOString()}, ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for storeName2: ${dates2.lastUpdatedDate.toISOString()}, ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(epochDate);
    expect(dates1.lastAccessedDate).toEqual(epochDate);
    expect(dates2.lastUpdatedDate).toEqual(initialDate);
    expect(dates2.lastAccessedDate).toEqual(initialDate);
  });

  it('should handle resetting dates multiple times', () => {
    log('\nTesting resetting dates multiple times...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-16T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const finalDates = getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved final reset dates: ${finalDates.lastUpdatedDate.toISOString()}, ${finalDates.lastAccessedDate.toISOString()}`,
    );

    expect(finalDates.lastUpdatedDate).toEqual(epochDate);
    expect(finalDates.lastAccessedDate).toEqual(epochDate);
  });

  it('should reset last updated date while keeping last accessed date', () => {
    log('\nTesting reset of last updated date while keeping last accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const epochDate = new Date(0);

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved unchanged accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(epochDate);
    expect(lastAccessedDate).toEqual(initialDate);
  });

  it('should handle resetting dates with invalid input', () => {
    log('\nTesting resetting dates with invalid input...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    // Simulate invalid input by passing undefined
    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: undefined,
      lastAccessedDate: undefined,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved reset accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should reset dates to a specific past date', () => {
    log('\nTesting reset of dates to a specific past date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const pastDate = new Date('2000-01-01T00:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: pastDate,
      lastAccessedDate: pastDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved reset updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved reset accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(pastDate);
    expect(lastAccessedDate).toEqual(pastDate);
  });
});
