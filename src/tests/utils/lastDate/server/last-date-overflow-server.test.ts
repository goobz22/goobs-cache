import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-overflow-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Overflow Scenarios', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Overflow Scenarios tests...');
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

  it('should handle maximum date value (8640000000000000 milliseconds)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxDate = new Date(8640000000000000);

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved maximum date value: ${result.toISOString()}`);
    expect(result).toEqual(maxDate);
  });

  it('should handle minimum date value (-8640000000000000 milliseconds)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minDate = new Date(-8640000000000000);

    await updateLastAccessedDate(mockSet, identifier, storeName, minDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved minimum date value: ${result.toISOString()}`);
    expect(result).toEqual(minDate);
  });

  it('should handle date value exceeding maximum (8640000000000001 milliseconds)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const overflowDate = new Date(8640000000000001);

    await updateLastUpdatedDate(mockSet, identifier, storeName, overflowDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after overflow: ${result.toISOString()}`);
    expect(result.getTime()).not.toBe(8640000000000001);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle date value below minimum (-8640000000000001 milliseconds)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const underflowDate = new Date(-8640000000000001);

    await updateLastAccessedDate(mockSet, identifier, storeName, underflowDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date after underflow: ${result.toISOString()}`);
    expect(result.getTime()).not.toBe(-8640000000000001);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle Infinity as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const infinityDate = new Date(Infinity);

    await updateLastUpdatedDate(mockSet, identifier, storeName, infinityDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for Infinity timestamp: ${result.toISOString()}`);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle -Infinity as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const negativeInfinityDate = new Date(-Infinity);

    await updateLastAccessedDate(mockSet, identifier, storeName, negativeInfinityDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for -Infinity timestamp: ${result.toISOString()}`);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle NaN as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nanDate = new Date(NaN);

    await updateLastUpdatedDate(mockSet, identifier, storeName, nanDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for NaN timestamp: ${result.toISOString()}`);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle Number.MAX_VALUE as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxValueDate = new Date(Number.MAX_VALUE);

    await updateLastAccessedDate(mockSet, identifier, storeName, maxValueDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for Number.MAX_VALUE timestamp: ${result.toISOString()}`);
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle Number.MIN_VALUE as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minValueDate = new Date(Number.MIN_VALUE);

    await updateLastUpdatedDate(mockSet, identifier, storeName, minValueDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for Number.MIN_VALUE timestamp: ${result.toISOString()}`);
    expect(result.getTime()).toBe(0);
  });

  it('should handle MAX_SAFE_INTEGER as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeIntegerDate = new Date(Number.MAX_SAFE_INTEGER);

    await updateLastAccessedDate(mockSet, identifier, storeName, maxSafeIntegerDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for MAX_SAFE_INTEGER timestamp: ${result.toISOString()}`);
    expect(result).toEqual(maxSafeIntegerDate);
  });

  it('should handle MIN_SAFE_INTEGER as timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minSafeIntegerDate = new Date(Number.MIN_SAFE_INTEGER);

    await updateLastUpdatedDate(mockSet, identifier, storeName, minSafeIntegerDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for MIN_SAFE_INTEGER timestamp: ${result.toISOString()}`);
    expect(result).toEqual(minSafeIntegerDate);
  });

  it('should handle date exceeding MAX_SAFE_INTEGER', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const exceedMaxSafeIntegerDate = new Date(Number.MAX_SAFE_INTEGER + 1);

    await updateLastAccessedDate(mockSet, identifier, storeName, exceedMaxSafeIntegerDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date exceeding MAX_SAFE_INTEGER: ${result.toISOString()}`);
    expect(result).toEqual(exceedMaxSafeIntegerDate);
    expect(result.getTime()).toBe(Number.MAX_SAFE_INTEGER + 1);
  });

  it('should handle date below MIN_SAFE_INTEGER', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const belowMinSafeIntegerDate = new Date(Number.MIN_SAFE_INTEGER - 1);

    await updateLastUpdatedDate(mockSet, identifier, storeName, belowMinSafeIntegerDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date below MIN_SAFE_INTEGER: ${result.toISOString()}`);
    expect(result).toEqual(belowMinSafeIntegerDate);
    expect(result.getTime()).toBe(Number.MIN_SAFE_INTEGER - 1);
  });

  it('should handle extreme future date (Year 275760)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const extremeFutureDate = new Date('+275760-09-13T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, extremeFutureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved extreme future date: ${result.toISOString()}`);
    expect(result).toEqual(extremeFutureDate);
  });

  it('should handle extreme past date (Year -271821)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const extremePastDate = new Date('-271821-04-20T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, extremePastDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved extreme past date: ${result.toISOString()}`);
    expect(result).toEqual(extremePastDate);
  });

  it('should handle date with maximum allowed milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxMillisecondsDate = new Date('2023-06-15T12:30:45.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, maxMillisecondsDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with maximum allowed milliseconds: ${result.toISOString()}`);
    expect(result).toEqual(maxMillisecondsDate);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('should handle updating with a date that causes overflow and then retrieving', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const overflowDate = new Date(8640000000000001);
    const validDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, overflowDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after overflow and valid update: ${result.toISOString()}`);
    expect(result).toEqual(validDate);
  });

  it('should handle updating both dates with overflow values', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const overflowDate1 = new Date(8640000000000001);
    const overflowDate2 = new Date(-8640000000000001);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: overflowDate1,
      lastAccessedDate: overflowDate2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date after overflow: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date after overflow: ${result.lastAccessedDate.toISOString()}`);
    expect(isNaN(result.lastUpdatedDate.getTime())).toBe(true);
    expect(isNaN(result.lastAccessedDate.getTime())).toBe(true);
  });

  it('should handle date value close to maximum timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const closeToMaxDate = new Date(8639999999999999); // One millisecond before max

    await updateLastUpdatedDate(mockSet, identifier, storeName, closeToMaxDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date close to maximum timestamp: ${result.toISOString()}`);
    expect(result).toEqual(closeToMaxDate);
    expect(result.getTime()).toBe(8639999999999999);
  });

  it('should handle date value close to minimum timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const closeToMinDate = new Date(-8639999999999999); // One millisecond after min

    await updateLastAccessedDate(mockSet, identifier, storeName, closeToMinDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date close to minimum timestamp: ${result.toISOString()}`);
    expect(result).toEqual(closeToMinDate);
    expect(result.getTime()).toBe(-8639999999999999);
  });

  it('should handle alternating between valid and overflow dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate1 = new Date('2023-06-15T12:00:00.000Z');
    const overflowDate = new Date(8640000000000001);
    const validDate2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, overflowDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate2);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date after alternating valid and overflow updates: ${result.toISOString()}`);
    expect(result).toEqual(validDate2);
  });
});
