import { updateLastDates, getLastDates } from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('update-last-dates-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - updateLastDates', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities updateLastDates tests...');
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

  it('should update both last updated and last accessed dates correctly', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-07-01T12:00:00.000Z');
    const accessedDate = new Date('2023-07-01T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should update only last updated date when only it is provided', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-07-02T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates with only lastUpdatedDate: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should update only last accessed date when only it is provided', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const accessedDate = new Date('2023-07-03T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates with only lastAccessedDate: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should update both dates with current time when no dates are provided', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const before = new Date();

    await updateLastDates(mockSet, identifier, storeName);
    const result = await getLastDates(mockGet, identifier, storeName);
    const after = new Date();

    log(`Updated and retrieved last dates with no dates provided: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.lastAccessedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle updating with invalid dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: invalidDate,
      lastAccessedDate: invalidDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates with invalid dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(new Date(0).getTime());
  });

  it('should handle updating multiple identifiers independently', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const date1 = new Date('2023-07-04T12:00:00.000Z');
    const date2 = new Date('2023-07-05T12:00:00.000Z');

    await updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier1, storeName);
    const result2 = await getLastDates(mockGet, identifier2, storeName);

    log(`Retrieved last dates for identifier1: ${JSON.stringify(result1)}`);
    log(`Retrieved last dates for identifier2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle updating multiple store names independently', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-07-06T12:00:00.000Z');
    const date2 = new Date('2023-07-07T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: date1,
      lastAccessedDate: date1,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: date2,
      lastAccessedDate: date2,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved last dates for storeName1: ${JSON.stringify(result1)}`);
    log(`Retrieved last dates for storeName2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle updating with dates at the epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates with epoch date: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating with dates near the maximum allowed JavaScript date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearMaxDate = new Date(8640000000000000 - 1);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: nearMaxDate,
      lastAccessedDate: nearMaxDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Updated and retrieved last dates with near maximum date: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(nearMaxDate);
    expect(result.lastAccessedDate).toEqual(nearMaxDate);
  });

  it('should handle rapid successive updates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 1000;
    const baseDate = new Date('2023-07-08T12:00:00.000Z');

    for (let i = 0; i < updateCount; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after rapid successive updates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(baseDate.getTime() + updateCount - 1));
    expect(result.lastAccessedDate).toEqual(new Date(baseDate.getTime() + updateCount - 1));
  });

  it('should handle updating with dates across daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeDST = new Date('2023-03-12T01:59:59.000Z');
    const afterDST = new Date('2023-03-12T03:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeDST,
      lastAccessedDate: afterDST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates across DST transition: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(beforeDST);
    expect(result.lastAccessedDate).toEqual(afterDST);
  });

  it('should handle updating with dates in different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const dateUTC = new Date('2023-07-09T12:00:00.000Z');
    const dateEST = new Date('2023-07-09T12:00:00.000-05:00');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: dateUTC,
      lastAccessedDate: dateEST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates set in different time zones: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(dateUTC);
    expect(result.lastAccessedDate.getTime()).toEqual(dateEST.getTime());
  });

  it('should handle concurrent updates to the same identifier and store', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updateCount = 100;
    const baseDate = new Date('2023-07-10T12:00:00.000Z');

    const updatePromises = Array.from({ length: updateCount }, (_, i) => {
      const date = new Date(baseDate.getTime() + i);
      return updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    });

    await Promise.all(updatePromises);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after concurrent updates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(
      baseDate.getTime() + updateCount - 1,
    );
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(baseDate.getTime());
    expect(result.lastAccessedDate.getTime()).toBeLessThanOrEqual(
      baseDate.getTime() + updateCount - 1,
    );
  });

  it('should handle updating with a frozen Date object', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const frozenDate = Object.freeze(new Date('2023-07-11T12:00:00.000Z'));

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: frozenDate,
      lastAccessedDate: frozenDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates set with frozen Date object: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(frozenDate);
    expect(result.lastAccessedDate).toEqual(frozenDate);
  });

  it('should handle updating with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const preciseDate = new Date('2023-07-12T12:00:00.123Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: preciseDate,
      lastAccessedDate: preciseDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates with millisecond precision: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(preciseDate);
    expect(result.lastAccessedDate).toEqual(preciseDate);
    expect(result.lastUpdatedDate.getMilliseconds()).toBe(123);
    expect(result.lastAccessedDate.getMilliseconds()).toBe(123);
  });

  it('should handle updating with dates very close to each other', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-13T12:00:00.000Z');
    const date2 = new Date('2023-07-13T12:00:00.001Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates very close to each other: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of a second', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-14T12:59:59.999Z');
    const date2 = new Date('2023-07-14T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of a second: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of a minute', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-15T12:59:59.999Z');
    const date2 = new Date('2023-07-15T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of a minute: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of an hour', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-16T12:59:59.999Z');
    const date2 = new Date('2023-07-16T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of an hour: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of a day', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-16T23:59:59.999Z');
    const date2 = new Date('2023-07-17T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of a day: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of a month', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-07-31T23:59:59.999Z');
    const date2 = new Date('2023-08-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of a month: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the turn of a year', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-12-31T23:59:59.999Z');
    const date2 = new Date('2024-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at the turn of a year: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with a Date object representing the current time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: now,
      lastAccessedDate: now,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates set to current time: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate.getTime()).toBeCloseTo(now.getTime(), -2); // Allow 10ms difference
    expect(result.lastAccessedDate.getTime()).toBeCloseTo(now.getTime(), -2); // Allow 10ms difference
  });

  it('should handle updating with only lastUpdatedDate as current time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: now });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last dates with only lastUpdatedDate as current time: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate.getTime()).toBeCloseTo(now.getTime(), -2); // Allow 10ms difference
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('should handle updating with only lastAccessedDate as current time', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: now });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last dates with only lastAccessedDate as current time: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeCloseTo(now.getTime(), -2); // Allow 10ms difference
  });

  it('should handle updating with dates in a leap year', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const leapYearDate = new Date('2024-02-29T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: leapYearDate,
      lastAccessedDate: leapYearDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates in a leap year: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(leapYearDate);
    expect(result.lastAccessedDate).toEqual(leapYearDate);
  });

  it('should handle updating with dates just before and after a leap second', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeLeapSecond = new Date('2016-12-31T23:59:59.999Z');
    const afterLeapSecond = new Date('2017-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: beforeLeapSecond,
      lastAccessedDate: afterLeapSecond,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates around a leap second: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(beforeLeapSecond);
    expect(result.lastAccessedDate).toEqual(afterLeapSecond);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle updating with dates at the limits of the Unix timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minUnixDate = new Date(-8640000000000000);
    const maxUnixDate = new Date(8640000000000000);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: minUnixDate,
      lastAccessedDate: maxUnixDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates at Unix timestamp limits: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(minUnixDate);
    expect(result.lastAccessedDate).toEqual(maxUnixDate);
  });

  it('should handle updating with invalid Date objects', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: invalidDate,
      lastAccessedDate: invalidDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after updating with invalid Date objects: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(new Date(0).getTime());
  });

  it('should handle updating with non-Date objects that have valid toISOString methods', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pseudoDate = {
      toISOString: () => '2023-07-20T12:00:00.000Z',
    };

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: pseudoDate as unknown as Date,
      lastAccessedDate: pseudoDate as unknown as Date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after updating with pseudo-Date objects: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date('2023-07-20T12:00:00.000Z'));
    expect(result.lastAccessedDate).toEqual(new Date('2023-07-20T12:00:00.000Z'));
  });

  it('should handle updating multiple times within the same millisecond', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-07-21T12:00:00.000Z');

    // Simulate multiple updates within the same millisecond
    await Promise.all([
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      }),
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      }),
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      }),
    ]);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last dates after multiple updates in same millisecond: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });
});
