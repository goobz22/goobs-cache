import { getLastDates, updateLastDates } from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-dates-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Update Last Dates', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Update Last Dates tests...');
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

  it('should update both last updated and last accessed dates correctly', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:30:00.000Z');
    const accessedDate = new Date('2023-06-15T10:31:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should overwrite existing dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialUpdatedDate = new Date('2023-06-15T10:30:00.000Z');
    const initialAccessedDate = new Date('2023-06-15T10:31:00.000Z');
    const newUpdatedDate = new Date('2023-06-16T14:45:00.000Z');
    const newAccessedDate = new Date('2023-06-16T14:46:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialUpdatedDate,
      lastAccessedDate: initialAccessedDate,
    });
    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: newUpdatedDate,
      lastAccessedDate: newAccessedDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved overwritten last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(
      `Retrieved overwritten last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(newUpdatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(newAccessedDate);
  });

  it('should handle updating with current date', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);
    const after = new Date();

    log(`Retrieved current last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved current last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDates.lastUpdatedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(retrievedDates.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(retrievedDates.lastAccessedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should update dates for different identifiers independently', () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const updatedDate1 = new Date('2023-06-17T09:00:00.000Z');
    const accessedDate1 = new Date('2023-06-17T09:01:00.000Z');
    const updatedDate2 = new Date('2023-06-18T11:30:00.000Z');
    const accessedDate2 = new Date('2023-06-18T11:31:00.000Z');

    updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: updatedDate1,
      lastAccessedDate: accessedDate1,
    });
    updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: updatedDate2,
      lastAccessedDate: accessedDate2,
    });

    const retrievedDates1 = getLastDates(mockGet, identifier1, storeName);
    const retrievedDates2 = getLastDates(mockGet, identifier2, storeName);

    log(
      `Retrieved dates for identifier1: ${retrievedDates1.lastUpdatedDate.toISOString()}, ${retrievedDates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for identifier2: ${retrievedDates2.lastUpdatedDate.toISOString()}, ${retrievedDates2.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates1.lastUpdatedDate).toEqual(updatedDate1);
    expect(retrievedDates1.lastAccessedDate).toEqual(accessedDate1);
    expect(retrievedDates2.lastUpdatedDate).toEqual(updatedDate2);
    expect(retrievedDates2.lastAccessedDate).toEqual(accessedDate2);
  });

  it('should update dates for different store names independently', () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const updatedDate1 = new Date('2023-06-19T13:15:00.000Z');
    const accessedDate1 = new Date('2023-06-19T13:16:00.000Z');
    const updatedDate2 = new Date('2023-06-20T15:00:00.000Z');
    const accessedDate2 = new Date('2023-06-20T15:01:00.000Z');

    updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: updatedDate1,
      lastAccessedDate: accessedDate1,
    });
    updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: updatedDate2,
      lastAccessedDate: accessedDate2,
    });

    const retrievedDates1 = getLastDates(mockGet, identifier, storeName1);
    const retrievedDates2 = getLastDates(mockGet, identifier, storeName2);

    log(
      `Retrieved dates for storeName1: ${retrievedDates1.lastUpdatedDate.toISOString()}, ${retrievedDates1.lastAccessedDate.toISOString()}`,
    );
    log(
      `Retrieved dates for storeName2: ${retrievedDates2.lastUpdatedDate.toISOString()}, ${retrievedDates2.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates1.lastUpdatedDate).toEqual(updatedDate1);
    expect(retrievedDates1.lastAccessedDate).toEqual(accessedDate1);
    expect(retrievedDates2.lastUpdatedDate).toEqual(updatedDate2);
    expect(retrievedDates2.lastAccessedDate).toEqual(accessedDate2);
  });

  it('should handle updating with invalid dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: invalidDate,
      lastAccessedDate: invalidDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after invalid update: ${retrievedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after invalid update: ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate).toEqual(new Date(0));
    expect(retrievedDates.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle updating with future dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureUpdatedDate = new Date('2100-01-01T00:00:00.000Z');
    const futureAccessedDate = new Date('2100-01-01T00:01:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: futureUpdatedDate,
      lastAccessedDate: futureAccessedDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved future last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved future last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(futureUpdatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(futureAccessedDate);
  });

  it('should handle updating with past dates', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pastUpdatedDate = new Date('1970-01-01T00:00:00.000Z');
    const pastAccessedDate = new Date('1970-01-01T00:01:00.000Z');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: pastUpdatedDate,
      lastAccessedDate: pastAccessedDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved past last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved past last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(pastUpdatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(pastAccessedDate);
  });

  it('should handle updating with only lastUpdatedDate', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-21T10:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(updatedDate);
    expect(retrievedDates.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle updating with only lastAccessedDate', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const accessedDate = new Date('2023-06-21T11:00:00.000Z');

    updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(new Date(0));
    expect(retrievedDates.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle updating with dates having different timezones', () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-22T10:00:00+02:00');
    const accessedDate = new Date('2023-06-22T15:00:00-05:00');

    updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const retrievedDates = getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate.toUTCString()).toEqual(updatedDate.toUTCString());
    expect(retrievedDates.lastAccessedDate.toUTCString()).toEqual(accessedDate.toUTCString());
  });
});
