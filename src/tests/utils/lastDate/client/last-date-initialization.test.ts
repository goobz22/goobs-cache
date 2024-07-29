import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-initialization-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Date Initialization', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Date Initialization tests...');
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

  it('should return default dates for uninitialized storage', () => {
    log('\nTesting default dates for uninitialized storage...');

    const identifier = 'testId';
    const storeName = 'testStore';

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should initialize dates with updateLastDates', () => {
    log('\nTesting date initialization with updateLastDates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initDate,
      lastAccessedDate: initDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(initDate);
    expect(lastAccessedDate).toEqual(initDate);
  });

  it('should initialize lastUpdatedDate independently', () => {
    log('\nTesting independent initialization of lastUpdatedDate...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, initDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(initDate);
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should initialize lastAccessedDate independently', () => {
    log('\nTesting independent initialization of lastAccessedDate...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initDate = new Date('2023-06-15T10:30:00.000Z');

    updateLastAccessedDate(mockSet, identifier, storeName, initDate);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(initDate);
  });

  it('should handle initialization with different dates', () => {
    log('\nTesting initialization with different dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:30:00.000Z');
    const accessedDate = new Date('2023-06-15T11:30:00.000Z');

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

  it('should maintain separate initializations for different identifiers', () => {
    log('\nTesting separate initializations for different identifiers...');

    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-16T10:30:00.000Z');

    updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const dates1 = getLastDates(mockGet, identifier1, storeName);
    const dates2 = getLastDates(mockGet, identifier2, storeName);

    log(
      `Retrieved dates for ${identifier1}: ${dates1.lastUpdatedDate.toISOString()}, ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for ${identifier2}: ${dates2.lastUpdatedDate.toISOString()}, ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(date1);
    expect(dates1.lastAccessedDate).toEqual(date1);
    expect(dates2.lastUpdatedDate).toEqual(date2);
    expect(dates2.lastAccessedDate).toEqual(date2);
  });

  it('should maintain separate initializations for different store names', () => {
    log('\nTesting separate initializations for different store names...');

    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-15T10:30:00.000Z');
    const date2 = new Date('2023-06-16T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const dates1 = getLastDates(mockGet, identifier, storeName1);
    const dates2 = getLastDates(mockGet, identifier, storeName2);

    log(
      `Retrieved dates for ${storeName1}: ${dates1.lastUpdatedDate.toISOString()}, ${dates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for ${storeName2}: ${dates2.lastUpdatedDate.toISOString()}, ${dates2.lastAccessedDate.toISOString()}`,
    );

    expect(dates1.lastUpdatedDate).toEqual(date1);
    expect(dates1.lastAccessedDate).toEqual(date1);
    expect(dates2.lastUpdatedDate).toEqual(date2);
    expect(dates2.lastAccessedDate).toEqual(date2);
  });

  it('should handle reinitialization of dates', () => {
    log('\nTesting reinitialization of dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const newDate = new Date('2023-06-16T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    let dates = getLastDates(mockGet, identifier, storeName);
    log(
      `Initial dates: ${dates.lastUpdatedDate.toISOString()}, ${dates.lastAccessedDate.toISOString()}`,
    );

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: newDate,
      lastAccessedDate: newDate,
    });

    dates = getLastDates(mockGet, identifier, storeName);
    log(
      `Reinitialized dates: ${dates.lastUpdatedDate.toISOString()}, ${dates.lastAccessedDate.toISOString()}`,
    );

    expect(dates.lastUpdatedDate).toEqual(newDate);
    expect(dates.lastAccessedDate).toEqual(newDate);
  });

  it('should handle partial reinitialization of dates', () => {
    log('\nTesting partial reinitialization of dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T10:30:00.000Z');
    const newUpdatedDate = new Date('2023-06-16T10:30:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    updateLastUpdatedDate(mockSet, identifier, storeName, newUpdatedDate);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(
      `Retrieved dates after partial reinitialization: ${lastUpdatedDate.toISOString()}, ${lastAccessedDate.toISOString()}`,
    );

    expect(lastUpdatedDate).toEqual(newUpdatedDate);
    expect(lastAccessedDate).toEqual(initialDate);
  });

  it('should handle initialization with current date', () => {
    log('\nTesting initialization with current date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: now,
      lastAccessedDate: now,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Retrieved dates: ${lastUpdatedDate.toISOString()}, ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate.getTime()).toBeCloseTo(now.getTime(), -3); // Allow 1 second difference
    expect(lastAccessedDate.getTime()).toBeCloseTo(now.getTime(), -3);
  });
});
