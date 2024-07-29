import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-reset-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Reset Functionality', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Reset Functionality tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = jest.fn(async (key: string): Promise<string | null> => mockStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    });
  });

  afterAll(() => {
    logStream.end();
  });

  it('should reset last updated date to default value', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, new Date(0));
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Reset last updated date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should reset last accessed date to default value', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, new Date(0));
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Reset last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should reset both dates simultaneously', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should reset last updated date to a specific point in time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, resetDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Reset last updated date to specific time: ${result.toISOString()}`);
    expect(result).toEqual(resetDate);
  });

  it('should reset last accessed date to a specific point in time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, resetDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Reset last accessed date to specific time: ${result.toISOString()}`);
    expect(result).toEqual(resetDate);
  });

  it('should handle resetting dates to the current time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    const beforeReset = new Date();
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
    });
    const afterReset = new Date();

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date to current time: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date to current time: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
    expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(afterReset.getTime());
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
    expect(result.lastAccessedDate.getTime()).toBeLessThanOrEqual(afterReset.getTime());
  });

  it('should reset dates for multiple identifiers independently', async () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate1 = new Date('2000-01-01T00:00:00.000Z');
    const resetDate2 = new Date('2010-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, initialDate);

    await updateLastUpdatedDate(mockSet, identifier1, storeName, resetDate1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, resetDate2);

    const result1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const result2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Reset date for identifier1: ${result1.toISOString()}`);
    log(`Reset date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(resetDate1);
    expect(result2).toEqual(resetDate2);
  });

  it('should reset dates for multiple store names independently', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate1 = new Date('2000-01-01T00:00:00.000Z');
    const resetDate2 = new Date('2010-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, initialDate);
    await updateLastAccessedDate(mockSet, identifier, storeName2, initialDate);

    await updateLastAccessedDate(mockSet, identifier, storeName1, resetDate1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, resetDate2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Reset date for storeName1: ${result1.toISOString()}`);
    log(`Reset date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(resetDate1);
    expect(result2).toEqual(resetDate2);
  });

  it('should handle resetting to an invalid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Result after resetting to invalid date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should reset dates to a far future time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const farFutureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: farFutureDate,
      lastAccessedDate: farFutureDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date to far future: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date to far future: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(farFutureDate);
    expect(result.lastAccessedDate).toEqual(farFutureDate);
  });

  it('should reset dates to a far past time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const farPastDate = new Date('1900-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: farPastDate,
      lastAccessedDate: farPastDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date to far past: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date to far past: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(farPastDate);
    expect(result.lastAccessedDate).toEqual(farPastDate);
  });

  it('should handle resetting dates multiple times', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDates = [
      new Date('2000-01-01T00:00:00.000Z'),
      new Date('2010-01-01T00:00:00.000Z'),
      new Date('2020-01-01T00:00:00.000Z'),
    ];

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);

    for (const resetDate of resetDates) {
      await updateLastUpdatedDate(mockSet, identifier, storeName, resetDate);
      const result = await getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Reset date: ${result.toISOString()}`);
      expect(result).toEqual(resetDate);
    }

    const finalResult = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(finalResult).toEqual(resetDates[resetDates.length - 1]);
  });

  it('should reset last updated date while keeping last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialUpdatedDate = new Date('2023-06-15T12:00:00.000Z');
    const initialAccessedDate = new Date('2023-06-16T12:00:00.000Z');
    const resetDate = new Date('2000-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialUpdatedDate,
      lastAccessedDate: initialAccessedDate,
    });
    await updateLastUpdatedDate(mockSet, identifier, storeName, resetDate);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Unchanged last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(resetDate);
    expect(result.lastAccessedDate).toEqual(initialAccessedDate);
  });

  it('should handle resetting dates with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate = new Date('2000-01-01T00:00:00.123Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: resetDate,
      lastAccessedDate: resetDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Reset last updated date with millisecond precision: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Reset last accessed date with millisecond precision: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(resetDate);
    expect(result.lastAccessedDate).toEqual(resetDate);
    expect(result.lastUpdatedDate.getMilliseconds()).toBe(123);
    expect(result.lastAccessedDate.getMilliseconds()).toBe(123);
  });

  it('should reset dates to the Unix epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const unixEpoch = new Date('1970-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: unixEpoch,
      lastAccessedDate: unixEpoch,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date to Unix epoch: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date to Unix epoch: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(unixEpoch);
    expect(result.lastAccessedDate).toEqual(unixEpoch);
    expect(result.lastUpdatedDate.getTime()).toBe(0);
    expect(result.lastAccessedDate.getTime()).toBe(0);
  });

  it('should handle resetting dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-03-12T01:59:59.000Z'); // Just before DST transition
    const resetDate = new Date('2023-03-12T03:00:00.000Z'); // Just after DST transition

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, resetDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Reset date across DST transition: ${result.toISOString()}`);
    expect(result).toEqual(resetDate);
    expect(result.getUTCHours()).toBe(3);
  });

  it('should reset dates to the maximum allowed JavaScript date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const maxJsDate = new Date(8.64e15); // Maximum allowed JavaScript date

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: maxJsDate,
      lastAccessedDate: maxJsDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Reset last updated date to max JS date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Reset last accessed date to max JS date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(maxJsDate);
    expect(result.lastAccessedDate).toEqual(maxJsDate);
    expect(result.lastUpdatedDate.getTime()).toBe(8.64e15);
    expect(result.lastAccessedDate.getTime()).toBe(8.64e15);
  });

  it('should handle resetting dates with different timezones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate = new Date('2000-01-01T00:00:00.000+05:30'); // UTC+5:30

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, resetDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Reset date with different timezone: ${result.toISOString()}`);
    expect(result.getTime()).toBe(resetDate.getTime());
    expect(result.getUTCHours()).toBe(18); // 00:00 UTC+5:30 is 18:30 previous day in UTC
    expect(result.getUTCMinutes()).toBe(30);
  });

  it('should reset dates while handling concurrent operations', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const resetDate1 = new Date('2000-01-01T00:00:00.000Z');
    const resetDate2 = new Date('2010-01-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);

    // Simulate concurrent reset operations
    const resetPromises = [
      updateLastUpdatedDate(mockSet, identifier, storeName, resetDate1),
      updateLastUpdatedDate(mockSet, identifier, storeName, resetDate2),
    ];

    await Promise.all(resetPromises);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Reset date after concurrent operations: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(resetDate1.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(resetDate2.getTime());
  });
});
