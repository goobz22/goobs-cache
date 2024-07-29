import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('zero-last-dates-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Zero Date Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Zero Date Handling tests...');
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

  it('should return epoch date for uninitialized last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved uninitialized last updated date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should return epoch date for uninitialized last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved uninitialized last accessed date: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should return epoch dates for uninitialized getLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved uninitialized last dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle updating with epoch date for last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after setting epoch date: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with epoch date for last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastAccessedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after setting epoch date: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with epoch dates for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after setting epoch dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating with null dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: null as unknown as Date,
      lastAccessedDate: null as unknown as Date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after setting null dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle updating with undefined dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: undefined,
      lastAccessedDate: undefined,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after setting undefined dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
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

    log(`Retrieved last dates after setting invalid dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(0);
  });

  it('should handle resetting dates to epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after resetting to epoch: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating with a mixture of valid and epoch dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: validDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last dates after setting mixture of valid and epoch dates: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(validDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating last updated date to epoch after a valid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after resetting to epoch: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating last accessed date to epoch after a valid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastAccessedDate(mockSet, identifier, storeName, validDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved last accessed date after resetting to epoch: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle multiple updates between valid and epoch dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate1 = new Date('2023-07-01T12:00:00.000Z');
    const validDate2 = new Date('2023-07-02T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate2);
    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after multiple updates: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with a date very close to epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const nearEpochDate = new Date(1); // 1 millisecond after epoch

    await updateLastUpdatedDate(mockSet, identifier, storeName, nearEpochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set very close to epoch: ${result.toISOString()}`);
    expect(result).toEqual(nearEpochDate);
  });

  it('should handle updating with a date just before epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const beforeEpochDate = new Date(-1); // 1 millisecond before epoch

    await updateLastUpdatedDate(mockSet, identifier, storeName, beforeEpochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date set just before epoch: ${result.toISOString()}`);
    expect(result).toEqual(beforeEpochDate);
  });

  it('should handle concurrent updates with epoch and valid dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await Promise.all([
      updateLastUpdatedDate(mockSet, identifier, storeName, validDate),
      updateLastUpdatedDate(mockSet, identifier, storeName, epochDate),
    ]);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after concurrent updates: ${result.toISOString()}`);
    expect(result).toEqual(validDate);
  });

  it('should handle updating with epoch date for one field and valid date for another', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: validDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates with epoch and valid date mix: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(validDate);
  });

  it('should handle updating with epoch date and then retrieving individual fields', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const updatedResult = await getLastUpdatedDate(mockGet, identifier, storeName);
    const accessedResult = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved individual last updated date: ${updatedResult.toISOString()}`);
    log(`Retrieved individual last accessed date: ${accessedResult.toISOString()}`);
    expect(updatedResult).toEqual(epochDate);
    expect(accessedResult).toEqual(epochDate);
  });

  it('should handle updating with epoch date for multiple identifiers', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    await updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const result1 = await getLastDates(mockGet, identifier1, storeName);
    const result2 = await getLastDates(mockGet, identifier2, storeName);

    log(`Retrieved last dates for identifier1: ${JSON.stringify(result1)}`);
    log(`Retrieved last dates for identifier2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(epochDate);
    expect(result1.lastAccessedDate).toEqual(epochDate);
    expect(result2.lastUpdatedDate).toEqual(epochDate);
    expect(result2.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating with epoch date for multiple store names', async () => {
    const identifier = 'testId';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName1, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    await updateLastDates(mockSet, identifier, storeName2, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });

    const result1 = await getLastDates(mockGet, identifier, storeName1);
    const result2 = await getLastDates(mockGet, identifier, storeName2);

    log(`Retrieved last dates for storeName1: ${JSON.stringify(result1)}`);
    log(`Retrieved last dates for storeName2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(epochDate);
    expect(result1.lastAccessedDate).toEqual(epochDate);
    expect(result2.lastUpdatedDate).toEqual(epochDate);
    expect(result2.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle updating with epoch date after a series of valid dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate1 = new Date('2023-07-01T12:00:00.000Z');
    const validDate2 = new Date('2023-07-02T12:00:00.000Z');
    const validDate3 = new Date('2023-07-03T12:00:00.000Z');
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate1);
    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate2);
    await updateLastUpdatedDate(mockSet, identifier, storeName, validDate3);
    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after series of updates: ${result.toISOString()}`);
    expect(result).toEqual(epochDate);
  });

  it('should handle rapid alternating updates between epoch and valid dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const validDate = new Date('2023-07-01T12:00:00.000Z');
    const epochDate = new Date(0);

    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) {
        await updateLastUpdatedDate(mockSet, identifier, storeName, validDate);
      } else {
        await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
      }
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after rapid alternating updates: ${result.toISOString()}`);
    expect(result).toEqual(validDate);
  });

  it('should handle updating with epoch date and then overwriting with a valid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const validDate = new Date('2023-07-01T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: validDate,
      lastAccessedDate: validDate,
    });

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after overwriting epoch with valid date: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(validDate);
    expect(result.lastAccessedDate).toEqual(validDate);
  });

  it('should handle updating one field with epoch date and another with valid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const validDate = new Date('2023-07-01T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: validDate,
    });

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates with mixed epoch and valid dates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(validDate);
  });

  it('should handle concurrent updates with epoch dates and valid dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const validDate = new Date('2023-07-01T12:00:00.000Z');

    await Promise.all([
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: epochDate,
        lastAccessedDate: epochDate,
      }),
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: validDate,
        lastAccessedDate: validDate,
      }),
    ]);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates after concurrent updates: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(validDate);
    expect(result.lastAccessedDate).toEqual(validDate);
  });

  it('should handle updating with epoch date for a large number of identifiers', async () => {
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const identifierCount = 1000;

    for (let i = 0; i < identifierCount; i++) {
      await updateLastDates(mockSet, `testId${i}`, storeName, {
        lastUpdatedDate: epochDate,
        lastAccessedDate: epochDate,
      });
    }

    const results = await Promise.all(
      Array.from({ length: identifierCount }, (_, i) =>
        getLastDates(mockGet, `testId${i}`, storeName),
      ),
    );

    log(`Retrieved last dates for ${identifierCount} identifiers`);
    results.forEach((result) => {
      expect(result.lastUpdatedDate).toEqual(epochDate);
      expect(result.lastAccessedDate).toEqual(epochDate);
    });
  });

  it('should handle updating with epoch date for a large number of store names', async () => {
    const identifier = 'testId';
    const epochDate = new Date(0);
    const storeCount = 1000;

    for (let i = 0; i < storeCount; i++) {
      await updateLastDates(mockSet, identifier, `testStore${i}`, {
        lastUpdatedDate: epochDate,
        lastAccessedDate: epochDate,
      });
    }

    const results = await Promise.all(
      Array.from({ length: storeCount }, (_, i) =>
        getLastDates(mockGet, identifier, `testStore${i}`),
      ),
    );

    log(`Retrieved last dates for ${storeCount} store names`);
    results.forEach((result) => {
      expect(result.lastUpdatedDate).toEqual(epochDate);
      expect(result.lastAccessedDate).toEqual(epochDate);
    });
  });

  it('should handle updating with epoch date and then immediately retrieving', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved last dates immediately after setting epoch date: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
  });

  it('should handle rapid successive updates between epoch and non-epoch dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const nonEpochDate = new Date('2023-07-01T12:00:00.000Z');
    const updateCount = 1000;

    for (let i = 0; i < updateCount; i++) {
      const date = i % 2 === 0 ? epochDate : nonEpochDate;
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date after rapid successive updates: ${result.toISOString()}`);
    expect(result).toEqual(nonEpochDate);
  });

  it('should handle updating with epoch date after a very large timestamp', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeTimestamp = new Date(8640000000000000); // Maximum date
    const epochDate = new Date(0);

    await updateLastUpdatedDate(mockSet, identifier, storeName, largeTimestamp);
    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after updating with large timestamp and then epoch: ${result.toISOString()}`,
    );
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with epoch date and then with an invalid date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, epochDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved last updated date after updating with epoch and then invalid date: ${result.toISOString()}`,
    );
    expect(result).toEqual(epochDate);
  });

  it('should handle updating with epoch date in different timezones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochUTC = new Date('1970-01-01T00:00:00.000Z');
    const epochEST = new Date('1969-12-31T19:00:00.000-05:00');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochUTC,
      lastAccessedDate: epochEST,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved last dates after updating with epoch in different timezones: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate.getTime()).toEqual(0);
    expect(result.lastAccessedDate.getTime()).toEqual(0);
  });
});
