import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('invalid-input-handling-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Invalid Input Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Invalid Input Handling tests...');
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

  it('should handle null identifier for getLastUpdatedDate', async () => {
    const identifier = null as unknown as string;
    const storeName = 'testStore';

    await expect(getLastUpdatedDate(mockGet, identifier, storeName)).rejects.toThrow();
    log('Successfully caught error for null identifier in getLastUpdatedDate');
  });

  it('should handle undefined store name for getLastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = undefined as unknown as string;

    await expect(getLastAccessedDate(mockGet, identifier, storeName)).rejects.toThrow();
    log('Successfully caught error for undefined store name in getLastAccessedDate');
  });

  it('should handle non-string identifier for updateLastUpdatedDate', async () => {
    const identifier = 123 as unknown as string;
    const storeName = 'testStore';
    const date = new Date();

    await expect(updateLastUpdatedDate(mockSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error for non-string identifier in updateLastUpdatedDate');
  });

  it('should handle non-string store name for updateLastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = { name: 'store' } as unknown as string;
    const date = new Date();

    await expect(updateLastAccessedDate(mockSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error for non-string store name in updateLastAccessedDate');
  });

  it('should handle invalid date input for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = 'not a date' as unknown as Date;

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: invalidDate,
      lastAccessedDate: invalidDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates after invalid date input:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle non-function get parameter', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidGet = 'not a function' as unknown as (key: string) => Promise<string | null>;

    await expect(getLastUpdatedDate(invalidGet, identifier, storeName)).rejects.toThrow();
    log('Successfully caught error for non-function get parameter');
  });

  it('should handle non-function set parameter', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();
    const invalidSet = 'not a function' as unknown as (key: string, value: string) => Promise<void>;

    await expect(updateLastUpdatedDate(invalidSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error for non-function set parameter');
  });

  it('should handle empty string identifier', async () => {
    const identifier = '';
    const storeName = 'testStore';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for empty string identifier: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle empty string store name', async () => {
    const identifier = 'testId';
    const storeName = '';
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for empty string store name: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle very long identifier', async () => {
    const identifier = 'a'.repeat(10000);
    const storeName = 'testStore';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for very long identifier: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle very long store name', async () => {
    const identifier = 'testId';
    const storeName = 'b'.repeat(10000);
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for very long store name: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifier with special characters', async () => {
    const identifier = 'test!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const storeName = 'testStore';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with special characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle store name with special characters', async () => {
    const identifier = 'testId';
    const storeName = 'store!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for store name with special characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle invalid JSON returned by get operation', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockResolvedValueOnce('{"invalidJson":');

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for invalid JSON: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle non-ISO8601 date string returned by get operation', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockResolvedValueOnce('not a valid date');

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for non-ISO8601 date string: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle NaN date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for NaN date input: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle Infinity as date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date(Infinity);

    await updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for Infinity date input: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle null date input in updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: null as unknown as Date,
      lastAccessedDate: null as unknown as Date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for null date input:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThan(0);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle date object with invalid prototype', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = Object.create(null);
    invalidDate.getTime = () => 1234567890000;

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate as unknown as Date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for date object with invalid prototype: ${result.toISOString()}`);
    expect(result).toEqual(new Date(1234567890000));
  });

  it('should handle non-object input for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidInput = 'not an object' as unknown as {
      lastUpdatedDate?: Date;
      lastAccessedDate?: Date;
    };

    await updateLastDates(mockSet, identifier, storeName, invalidInput);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for non-object input:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle circular reference in identifier', async () => {
    interface CircularObject {
      ref?: CircularObject;
    }
    const circular: CircularObject = {};
    circular.ref = circular;
    const identifier = circular as unknown as string;
    const storeName = 'testStore';
    const date = new Date();

    await expect(updateLastUpdatedDate(mockSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error for circular reference in identifier');
  });

  it('should handle Symbol as identifier', async () => {
    const identifier = Symbol('test') as unknown as string;
    const storeName = 'testStore';

    await expect(getLastUpdatedDate(mockGet, identifier, storeName)).rejects.toThrow();
    log('Successfully caught error for Symbol as identifier');
  });

  it('should handle BigInt as store name', async () => {
    const identifier = 'testId';
    const storeName = BigInt(123) as unknown as string;
    const date = new Date();

    await expect(updateLastAccessedDate(mockSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error for BigInt as store name');
  });

  it('should handle non-integer timestamp as date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('2023-06-15T12:30:30.1234567Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for non-integer timestamp: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-06-15T12:30:30.123Z'));
  });

  it('should handle date before Unix epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const oldDate = new Date('1969-12-31T23:59:59.999Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, oldDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for date before Unix epoch: ${result.toISOString()}`);
    expect(result).toEqual(oldDate);
  });

  it('should handle very far future date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureDate = new Date('275760-09-13T00:00:00.000Z'); // Maximum date in ECMAScript

    await updateLastUpdatedDate(mockSet, identifier, storeName, futureDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved very far future date: ${result.toISOString()}`);
    expect(result).toEqual(futureDate);
  });

  it('should handle non-existent properties in updateLastDates input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidInput = { nonExistentProp: new Date() } as unknown as {
      lastUpdatedDate?: Date;
      lastAccessedDate?: Date;
    };

    await updateLastDates(mockSet, identifier, storeName, invalidInput);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for input with non-existent properties:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle frozen object as input for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const frozenInput = Object.freeze({
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
    });

    await updateLastDates(mockSet, identifier, storeName, frozenInput);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for frozen object input:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(frozenInput.lastUpdatedDate);
    expect(result.lastAccessedDate).toEqual(frozenInput.lastAccessedDate);
  });

  it('should handle proxy object as date input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const proxyDate = new Proxy(new Date(), {});

    await updateLastUpdatedDate(mockSet, identifier, storeName, proxyDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for proxy object input: ${result.toISOString()}`);
    expect(result).toEqual(proxyDate);
  });

  it('should handle date object with overridden toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customDate = new Date();
    customDate.toISOString = () => 'Custom ISO String';

    await updateLastAccessedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for object with overridden toISOString: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(customDate.getTime());
  });

  it('should handle non-enumerable properties in updateLastDates input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const input = {};
    Object.defineProperty(input, 'lastUpdatedDate', { value: new Date(), enumerable: false });
    Object.defineProperty(input, 'lastAccessedDate', { value: new Date(), enumerable: false });

    await updateLastDates(
      mockSet,
      identifier,
      storeName,
      input as { lastUpdatedDate?: Date; lastAccessedDate?: Date },
    );
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for input with non-enumerable properties:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle getter-only properties in updateLastDates input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const input = {
      get lastUpdatedDate() {
        return new Date();
      },
      get lastAccessedDate() {
        return new Date();
      },
    };

    await updateLastDates(mockSet, identifier, storeName, input);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for input with getter-only properties:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThan(0);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle input with toString and valueOf overridden for identifier', async () => {
    const identifier = {
      toString: () => 'customIdentifier',
      valueOf: () => 'differentIdentifier',
    } as unknown as string;
    const storeName = 'testStore';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with overridden toString and valueOf: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle input with toString and valueOf overridden for store name', async () => {
    const identifier = 'testId';
    const storeName = {
      toString: () => 'customStore',
      valueOf: () => 'differentStore',
    } as unknown as string;
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for store name with overridden toString and valueOf: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle Date object with invalid time value', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('Invalid Date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for Date object with invalid time value: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle updateLastDates with only one valid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date();
    const invalidDate = new Date('Invalid Date');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: validDate,
      lastAccessedDate: invalidDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with only one valid date:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(validDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle very small time differences between dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-15T12:00:00.001Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with very small time difference:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date1);
    expect(result.lastAccessedDate).toEqual(date2);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle dates with different timezones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-15T12:00:00+02:00');
    const date2 = new Date('2023-06-15T10:00:00Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date1,
      lastAccessedDate: date2,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with different timezones:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toEqual(date1.getTime());
    expect(result.lastAccessedDate.getTime()).toEqual(date2.getTime());
  });

  it('should handle Date objects created with timestamps', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const timestamp = 1623760800000; // 2021-06-15T12:00:00.000Z
    const date = new Date(timestamp);

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date created with timestamp: ${result.toISOString()}`);
    expect(result.getTime()).toEqual(timestamp);
  });

  it('should handle Date objects with milliseconds', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T12:00:00.123Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date with milliseconds: ${result.toISOString()}`);
    expect(result).toEqual(date);
    expect(result.getMilliseconds()).toBe(123);
  });

  it('should handle updateLastDates with same date for both fields', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with same date for both fields:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
    expect(result.lastUpdatedDate).toBe(result.lastAccessedDate);
  });

  it('should handle non-date objects with toISOString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const pseudoDate = {
      toISOString: () => '2023-06-15T12:00:00.000Z',
    };

    await updateLastUpdatedDate(mockSet, identifier, storeName, pseudoDate as unknown as Date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for non-date object with toISOString method: ${result.toISOString()}`);
    expect(result.toISOString()).toBe('2023-06-15T12:00:00.000Z');
  });

  it('should handle date input with custom properties', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    interface CustomDate extends Date {
      customProp?: string;
    }

    const dateWithCustomProp: CustomDate = new Date('2023-06-15T12:00:00.000Z');
    dateWithCustomProp.customProp = 'test';

    await updateLastAccessedDate(mockSet, identifier, storeName, dateWithCustomProp);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for input with custom properties: ${result.toISOString()}`);
    expect(result).toEqual(new Date('2023-06-15T12:00:00.000Z'));
    expect((result as CustomDate).customProp).toBeUndefined();
  });

  it('should handle updateLastDates with only lastUpdatedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: date });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with only lastUpdatedDate:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(date.getTime());
  });

  it('should handle updateLastDates with only lastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: date });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates with only lastAccessedDate:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle date input with overridden getTime method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customDate = new Date('2023-06-15T12:00:00.000Z');
    customDate.getTime = () => 1000000000000;

    await updateLastUpdatedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for input with overridden getTime method: ${result.toISOString()}`);
    expect(result.getTime()).toBe(1000000000000);
  });

  it('should handle date input with non-numeric getTime result', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('2023-06-15T12:00:00.000Z');
    invalidDate.getTime = () => 'not a number' as unknown as number;

    await updateLastAccessedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for input with non-numeric getTime result: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle updateLastDates with dates in reverse chronological order', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const earlierDate = new Date('2023-06-15T12:00:00.000Z');
    const laterDate = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: laterDate,
      lastAccessedDate: earlierDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates in reverse chronological order:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(laterDate);
    expect(result.lastAccessedDate).toEqual(earlierDate);
  });

  it('should handle date input with maximum safe integer timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeDate = new Date(Number.MAX_SAFE_INTEGER);

    await updateLastUpdatedDate(mockSet, identifier, storeName, maxSafeDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for maximum safe integer timestamp: ${result.toISOString()}`);
    expect(result).toEqual(maxSafeDate);
  });

  it('should handle date input with minimum safe integer timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const minSafeDate = new Date(Number.MIN_SAFE_INTEGER);

    await updateLastAccessedDate(mockSet, identifier, storeName, minSafeDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for minimum safe integer timestamp: ${result.toISOString()}`);
    expect(result).toEqual(minSafeDate);
  });

  it('should handle updateLastDates with prototype-less object input', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const inputDates = Object.create(null);
    inputDates.lastUpdatedDate = new Date('2023-06-15T12:00:00.000Z');
    inputDates.lastAccessedDate = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, inputDates);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from prototype-less object input:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(inputDates.lastUpdatedDate);
    expect(result.lastAccessedDate).toEqual(inputDates.lastAccessedDate);
  });

  it('should handle date input with overridden valueOf method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customDate = new Date('2023-06-15T12:00:00.000Z');
    customDate.valueOf = () => 1000000000000;

    await updateLastUpdatedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for input with overridden valueOf method: ${result.toISOString()}`);
    expect(result.valueOf()).toBe(1000000000000);
  });

  it('should handle updateLastDates with non-date objects having toJSON method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customObject = {
      toJSON: () => '2023-06-15T12:00:00.000Z',
    };

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: customObject as unknown as Date,
      lastAccessedDate: customObject as unknown as Date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from objects with toJSON method:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date('2023-06-15T12:00:00.000Z'));
    expect(result.lastAccessedDate).toEqual(new Date('2023-06-15T12:00:00.000Z'));
  });

  it('should handle extremely large time values', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeTimeValue = Number.MAX_VALUE;
    const dateWithLargeTime = new Date(largeTimeValue);

    await updateLastUpdatedDate(mockSet, identifier, storeName, dateWithLargeTime);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for extremely large time value: ${result.toISOString()}`);
    expect(result.getTime()).toBe(largeTimeValue);
  });

  it('should handle updateLastDates with inherited date properties', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const baseObject = { lastUpdatedDate: new Date('2023-06-15T12:00:00.000Z') };
    const inheritedObject = Object.create(baseObject) as typeof baseObject & {
      lastAccessedDate: Date;
    };
    inheritedObject.lastAccessedDate = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, inheritedObject);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from object with inherited properties:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(baseObject.lastUpdatedDate);
    expect(result.lastAccessedDate).toEqual(inheritedObject.lastAccessedDate);
  });

  it('should handle date input with custom [Symbol.toPrimitive] method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customDate = new Date('2023-06-17T12:00:00.000Z');
    (customDate as unknown as { [Symbol.toPrimitive]: (hint: string) => number | string })[
      Symbol.toPrimitive
    ] = (hint: string): number | string =>
      hint === 'number' ? 1687003200000 : '2023-06-17T12:00:00.000Z';

    await updateLastUpdatedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for input with custom [Symbol.toPrimitive] method: ${result.toISOString()}`,
    );
    expect(result).toEqual(new Date('2023-06-17T12:00:00.000Z'));
  });

  it('should handle updateLastDates with getter that throws an error', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const errorObject = {
      get lastUpdatedDate(): never {
        throw new Error('Getter error');
      },
      lastAccessedDate: new Date('2023-06-18T12:00:00.000Z'),
    };

    await updateLastDates(mockSet, identifier, storeName, errorObject);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from object with error-throwing getter:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(errorObject.lastAccessedDate);
  });

  it('should handle date input with overridden toString method', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const customDate = new Date('2023-06-19T12:00:00.000Z');
    (customDate as { toString: () => string }).toString = () => 'Custom Date String';

    await updateLastAccessedDate(mockSet, identifier, storeName, customDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for input with overridden toString method: ${result.toISOString()}`);
    expect(result).toEqual(customDate);
  });

  it('should handle updateLastDates with non-enumerable date properties', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const inputObject: { lastUpdatedDate?: Date; lastAccessedDate?: Date } = {};
    Object.defineProperties(inputObject, {
      lastUpdatedDate: {
        value: new Date('2023-06-20T12:00:00.000Z'),
        enumerable: false,
      },
      lastAccessedDate: {
        value: new Date('2023-06-21T12:00:00.000Z'),
        enumerable: false,
      },
    });

    await updateLastDates(mockSet, identifier, storeName, inputObject);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from object with non-enumerable properties:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle input with Symbol keys', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const symbolKey = Symbol('date');
    const inputObject: { [key: symbol]: Date } = {
      [symbolKey]: new Date('2023-06-22T12:00:00.000Z'),
    };

    await updateLastDates(
      mockSet,
      identifier,
      storeName,
      inputObject as unknown as { lastUpdatedDate?: Date; lastAccessedDate?: Date },
    );
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from object with Symbol keys:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle updateLastDates with proxy Date objects', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const proxyDate = new Proxy(new Date('2023-06-23T12:00:00.000Z'), {
      get(target: Date, prop: string | symbol): unknown {
        if (prop === 'getTime') {
          return (): number => target.getTime() + 1000; // Add 1 second
        }
        return Reflect.get(target, prop);
      },
    });

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: proxyDate,
      lastAccessedDate: proxyDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates from proxy Date objects:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBe(new Date('2023-06-23T12:00:01.000Z').getTime());
    expect(result.lastAccessedDate.getTime()).toBe(new Date('2023-06-23T12:00:01.000Z').getTime());
  });
});
