import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-initialization-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Initialization', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Initialization tests...');
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

  it('should return default date when getting last updated date for uninitialized identifier', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date for uninitialized identifier: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should return default date when getting last accessed date for uninitialized identifier', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date for uninitialized identifier: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should initialize last updated date on first update', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, initialDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after first update: ${result.toISOString()}`);
    expect(result).toEqual(initialDate);
  });

  it('should initialize last accessed date on first update', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after first update: ${result.toISOString()}`);
    expect(result).toEqual(initialDate);
  });

  it('should return default dates when getting both dates for uninitialized identifier', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';

    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date for uninitialized identifier: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date for uninitialized identifier: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should initialize both dates on first update', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date after first update: ${result.lastUpdatedDate.toISOString()}`);
    log(
      `Retrieved last accessed date after first update: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(initialDate);
    expect(result.lastAccessedDate).toEqual(initialDate);
  });

  it('should handle initialization with current date when no date is provided', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const before = new Date();

    await updateLastDates(mockSet, identifier, storeName);
    const result = await getLastDates(mockGet, identifier, storeName);
    const after = new Date();

    log(
      `Retrieved last updated date initialized with current date: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date initialized with current date: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.lastAccessedDate.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle initialization of multiple identifiers independently', async () => {
    const identifier1 = 'newId1';
    const identifier2 = 'newId2';
    const storeName = 'newStore';
    const date1 = new Date('2023-06-16T10:00:00.000Z');
    const date2 = new Date('2023-06-16T11:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const result2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle initialization of multiple store names independently', async () => {
    const identifier = 'newId';
    const storeName1 = 'newStore1';
    const storeName2 = 'newStore2';
    const date1 = new Date('2023-06-17T10:00:00.000Z');
    const date2 = new Date('2023-06-17T11:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName1, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName2, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier, storeName1);
    const result2 = await getLastAccessedDate(mockGet, identifier, storeName2);

    log(`Retrieved last accessed date for storeName1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for storeName2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle initialization with only lastUpdatedDate', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const updatedDate = new Date('2023-06-18T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should handle initialization with only lastAccessedDate', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const accessedDate = new Date('2023-06-19T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle initialization with invalid date input', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const invalidDate = new Date('Invalid Date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after invalid input: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle concurrent initializations', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const date1 = new Date('2023-06-20T12:00:00.000Z');
    const date2 = new Date('2023-06-20T12:00:01.000Z');

    await Promise.all([
      updateLastUpdatedDate(mockSet, identifier, storeName, date1),
      updateLastUpdatedDate(mockSet, identifier, storeName, date2),
    ]);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after concurrent initializations: ${result.toISOString()}`);
    expect(result.getTime()).toBeGreaterThanOrEqual(date1.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(date2.getTime());
  });

  it('should handle initialization with future date', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const futureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, futureDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date initialized with future date: ${result.toISOString()}`);
    expect(result).toEqual(futureDate);
  });

  it('should handle initialization after failed get operation', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const date = new Date('2023-06-21T12:00:00.000Z');

    mockGet.mockRejectedValueOnce(new Error('Get operation failed'));

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after failed get operation: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle reinitialization after clearing storage', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const initialDate = new Date('2023-06-22T12:00:00.000Z');
    const reinitializedDate = new Date('2023-06-22T13:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    mockStorage = {}; // Clear storage
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: reinitializedDate,
      lastAccessedDate: reinitializedDate,
    });

    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after reinitialization: ${result.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved last accessed date after reinitialization: ${result.lastAccessedDate.toISOString()}`,
    );
    expect(result.lastUpdatedDate).toEqual(reinitializedDate);
    expect(result.lastAccessedDate).toEqual(reinitializedDate);
  });

  it('should handle initialization with custom date object', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';
    const customDate = {
      toISOString: () => '2023-06-23T12:00:00.000Z',
      getTime: () => new Date('2023-06-23T12:00:00.000Z').getTime(),
    };

    await updateLastUpdatedDate(mockSet, identifier, storeName, customDate as unknown as Date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date initialized with custom date object: ${result.toISOString()}`);
    expect(result.toISOString()).toBe('2023-06-23T12:00:00.000Z');
  });
});
