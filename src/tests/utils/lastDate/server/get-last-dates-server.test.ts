import { getLastDates, updateLastDates } from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('get-last-dates-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Get Last Dates', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Get Last Dates tests...');
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

  it('should retrieve both last updated and last accessed dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:00:00.000Z');
    const accessedDate = new Date('2023-06-15T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should return default dates when no dates are set', async () => {
    const identifier = 'newId';
    const storeName = 'newStore';

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved default last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved default last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle case when only last updated date is set', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-16T10:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should handle case when only last accessed date is set', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const accessedDate = new Date('2023-06-17T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle multiple calls to getLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-18T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName);
    log(`First call - Last updated date: ${result1.lastUpdatedDate.toISOString()}`);
    log(`First call - Last accessed date: ${result1.lastAccessedDate.toISOString()}`);

    const result2 = await getLastDates(mockGet, identifier, storeName);
    log(`Second call - Last updated date: ${result2.lastUpdatedDate.toISOString()}`);
    log(`Second call - Last accessed date: ${result2.lastAccessedDate.toISOString()}`);

    expect(result1.lastUpdatedDate).toEqual(initialDate);
    expect(result1.lastAccessedDate).toEqual(initialDate);
    expect(result2.lastUpdatedDate).toEqual(initialDate);
    expect(result2.lastAccessedDate).toEqual(initialDate);
  });

  it('should handle different identifiers', async () => {
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-19T13:00:00.000Z');
    const date2 = new Date('2023-06-19T14:00:00.000Z');

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

    log(`Identifier1 - Last updated date: ${result1.lastUpdatedDate.toISOString()}`);
    log(`Identifier1 - Last accessed date: ${result1.lastAccessedDate.toISOString()}`);
    log(`Identifier2 - Last updated date: ${result2.lastUpdatedDate.toISOString()}`);
    log(`Identifier2 - Last accessed date: ${result2.lastAccessedDate.toISOString()}`);

    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle different store names', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const date1 = new Date('2023-06-20T15:00:00.000Z');
    const date2 = new Date('2023-06-20T16:00:00.000Z');

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

    log(`Store1 - Last updated date: ${result1.lastUpdatedDate.toISOString()}`);
    log(`Store1 - Last accessed date: ${result1.lastAccessedDate.toISOString()}`);
    log(`Store2 - Last updated date: ${result2.lastUpdatedDate.toISOString()}`);
    log(`Store2 - Last accessed date: ${result2.lastAccessedDate.toISOString()}`);

    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle getLastDates with empty identifier', async () => {
    const identifier = '';
    const storeName = 'testStore';
    const date = new Date('2023-06-21T10:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Empty identifier - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Empty identifier - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle getLastDates with empty store name', async () => {
    const identifier = 'testId';
    const storeName = '';
    const date = new Date('2023-06-22T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Empty store name - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Empty store name - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle getLastDates with very old dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const oldDate = new Date('1970-01-01T00:00:00.001Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: oldDate,
      lastAccessedDate: oldDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Very old date - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Very old date - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(oldDate);
    expect(result.lastAccessedDate).toEqual(oldDate);
  });

  it('should handle getLastDates with future dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureDate = new Date('2100-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: futureDate,
      lastAccessedDate: futureDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Future date - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Future date - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(futureDate);
    expect(result.lastAccessedDate).toEqual(futureDate);
  });

  it('should handle getLastDates when storage returns invalid JSON', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockResolvedValueOnce('invalid JSON');

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Invalid JSON - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Invalid JSON - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle getLastDates when storage throws an error', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockRejectedValueOnce(new Error('Storage error'));

    await expect(getLastDates(mockGet, identifier, storeName)).rejects.toThrow('Storage error');
    log('Successfully caught storage error in getLastDates');
  });

  it('should handle getLastDates with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-23T12:34:56.789Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Millisecond precision - Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Millisecond precision - Last accessed date: ${result.lastAccessedDate.toISOString()}`);

    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
    expect(result.lastUpdatedDate.getMilliseconds()).toBe(789);
    expect(result.lastAccessedDate.getMilliseconds()).toBe(789);
  });
});
