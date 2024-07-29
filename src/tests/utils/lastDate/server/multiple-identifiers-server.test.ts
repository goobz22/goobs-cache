import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-identifiers-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Multiple Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Multiple Identifiers tests...');
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

  it('should handle multiple identifiers for last updated date', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const result2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for identifier1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle multiple identifiers for last accessed date', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier1, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier1, storeName);
    const result2 = await getLastAccessedDate(mockGet, identifier2, storeName);

    log(`Retrieved last accessed date for identifier1: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle multiple identifiers for both dates', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

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

    log(`Retrieved dates for identifier1: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for identifier2: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle updating one identifier without affecting others', async () => {
    const storeName = 'testStore';
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const initialDate = new Date('2023-06-15T12:00:00.000Z');
    const updatedDate = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier1, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });
    await updateLastDates(mockSet, identifier2, storeName, {
      lastUpdatedDate: initialDate,
      lastAccessedDate: initialDate,
    });

    await updateLastUpdatedDate(mockSet, identifier1, storeName, updatedDate);

    const result1 = await getLastDates(mockGet, identifier1, storeName);
    const result2 = await getLastDates(mockGet, identifier2, storeName);

    log(`Retrieved dates for identifier1 after update: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for identifier2 after update: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(updatedDate);
    expect(result1.lastAccessedDate).toEqual(initialDate);
    expect(result2.lastUpdatedDate).toEqual(initialDate);
    expect(result2.lastAccessedDate).toEqual(initialDate);
  });

  it('should handle a large number of identifiers', async () => {
    const storeName = 'testStore';
    const identifierCount = 1000;
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    for (let i = 0; i < identifierCount; i++) {
      const identifier = `testId${i}`;
      const date = new Date(baseDate.getTime() + i * 1000);
      await updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < identifierCount; i++) {
      const identifier = `testId${i}`;
      const expectedDate = new Date(baseDate.getTime() + i * 1000);
      const result = await getLastDates(mockGet, identifier, storeName);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }

    log(`Successfully handled ${identifierCount} identifiers`);
  });

  it('should handle identifiers with special characters', async () => {
    const storeName = 'testStore';
    const identifier1 = 'test!@#$%^&*()_+[]{}|;:,.<>?`~Id1';
    const identifier2 = 'test-123_456.789@example.com';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

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

    log(`Retrieved dates for identifier with special characters: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for identifier with email-like format: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle very long identifiers', async () => {
    const storeName = 'testStore';
    const identifier1 = 'a'.repeat(1000);
    const identifier2 = 'b'.repeat(1000);
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier1, storeName, date1);
    await updateLastUpdatedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastUpdatedDate(mockGet, identifier1, storeName);
    const result2 = await getLastUpdatedDate(mockGet, identifier2, storeName);

    log(`Retrieved last updated date for very long identifier1: ${result1.toISOString()}`);
    log(`Retrieved last updated date for very long identifier2: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle identifiers with different cases', async () => {
    const storeName = 'testStore';
    const identifier1 = 'TestIdentifier';
    const identifier2 = 'testidentifier';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier1, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier1, storeName);
    const result2 = await getLastAccessedDate(mockGet, identifier2, storeName);

    log(`Retrieved last accessed date for identifier with uppercase: ${result1.toISOString()}`);
    log(`Retrieved last accessed date for identifier with lowercase: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle updating multiple identifiers concurrently', async () => {
    const storeName = 'testStore';
    const identifierCount = 100;
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    const updatePromises = Array.from({ length: identifierCount }, (_, i) => {
      const identifier = `testId${i}`;
      const date = new Date(baseDate.getTime() + i * 1000);
      return updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    });

    await Promise.all(updatePromises);

    const getPromises = Array.from({ length: identifierCount }, (_, i) => {
      const identifier = `testId${i}`;
      return getLastDates(mockGet, identifier, storeName);
    });

    const results = await Promise.all(getPromises);

    results.forEach((result, i) => {
      const expectedDate = new Date(baseDate.getTime() + i * 1000);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    });

    log(`Successfully handled concurrent updates for ${identifierCount} identifiers`);
  });

  it('should handle identifiers with Unicode characters', async () => {
    const storeName = 'testStore';
    const identifier1 = '테스트ID1';
    const identifier2 = '測試ID2';
    const date1 = new Date('2023-06-15T12:00:00.000Z');
    const date2 = new Date('2023-06-16T12:00:00.000Z');

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

    log(`Retrieved dates for identifier with Korean characters: ${JSON.stringify(result1)}`);
    log(`Retrieved dates for identifier with Chinese characters: ${JSON.stringify(result2)}`);
    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);
  });

  it('should handle identifiers with empty strings', async () => {
    const storeName = 'testStore';
    const identifier = '';
    const date = new Date('2023-06-15T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved last updated date for empty string identifier: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle updating and retrieving dates for multiple identifiers in sequence', async () => {
    const storeName = 'testStore';
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];
    const baseDate = new Date('2023-06-15T12:00:00.000Z');

    for (let i = 0; i < identifiers.length; i++) {
      const date = new Date(baseDate.getTime() + i * 86400000); // Add i days
      await updateLastDates(mockSet, identifiers[i], storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    }

    for (let i = 0; i < identifiers.length; i++) {
      const expectedDate = new Date(baseDate.getTime() + i * 86400000);
      const result = await getLastDates(mockGet, identifiers[i], storeName);
      log(`Retrieved dates for identifier ${identifiers[i]}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(expectedDate);
      expect(result.lastAccessedDate).toEqual(expectedDate);
    }
  });

  it('should handle interleaved updates of multiple identifiers', async () => {
    const storeName = 'testStore';
    const identifiers = ['idA', 'idB', 'idC'];
    const baseDate = new Date('2023-06-20T10:00:00.000Z');

    for (let i = 0; i < 5; i++) {
      for (const identifier of identifiers) {
        const date = new Date(baseDate.getTime() + i * 3600000); // Add i hours
        if (i % 2 === 0) {
          await updateLastUpdatedDate(mockSet, identifier, storeName, date);
        } else {
          await updateLastAccessedDate(mockSet, identifier, storeName, date);
        }
      }
    }

    for (const identifier of identifiers) {
      const result = await getLastDates(mockGet, identifier, storeName);
      log(`Final dates for identifier ${identifier}: ${JSON.stringify(result)}`);
      expect(result.lastUpdatedDate).toEqual(new Date(baseDate.getTime() + 3600000 * 4)); // 4 hours after base
      expect(result.lastAccessedDate).toEqual(new Date(baseDate.getTime() + 3600000 * 3)); // 3 hours after base
    }
  });

  it('should maintain separate date records for each identifier', async () => {
    const storeName = 'testStore';
    const identifier1 = 'uniqueId1';
    const identifier2 = 'uniqueId2';
    const date1 = new Date('2023-06-25T15:00:00.000Z');
    const date2 = new Date('2023-06-26T16:00:00.000Z');

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

    log(`Dates for identifier1: ${JSON.stringify(result1)}`);
    log(`Dates for identifier2: ${JSON.stringify(result2)}`);

    expect(result1.lastUpdatedDate).toEqual(date1);
    expect(result1.lastAccessedDate).toEqual(date1);
    expect(result2.lastUpdatedDate).toEqual(date2);
    expect(result2.lastAccessedDate).toEqual(date2);

    // Update only identifier1
    const newDate1 = new Date('2023-06-27T17:00:00.000Z');
    await updateLastUpdatedDate(mockSet, identifier1, storeName, newDate1);

    const updatedResult1 = await getLastDates(mockGet, identifier1, storeName);
    const unchangedResult2 = await getLastDates(mockGet, identifier2, storeName);

    log(`Updated dates for identifier1: ${JSON.stringify(updatedResult1)}`);
    log(`Unchanged dates for identifier2: ${JSON.stringify(unchangedResult2)}`);

    expect(updatedResult1.lastUpdatedDate).toEqual(newDate1);
    expect(updatedResult1.lastAccessedDate).toEqual(date1);
    expect(unchangedResult2).toEqual(result2);
  });

  it('should handle a mix of existent and non-existent identifiers', async () => {
    const storeName = 'testStore';
    const existingIdentifier = 'existingId';
    const nonExistentIdentifier = 'nonExistentId';
    const date = new Date('2023-06-28T18:00:00.000Z');

    await updateLastUpdatedDate(mockSet, existingIdentifier, storeName, date);

    const existingResult = await getLastDates(mockGet, existingIdentifier, storeName);
    const nonExistentResult = await getLastDates(mockGet, nonExistentIdentifier, storeName);

    log(`Dates for existing identifier: ${JSON.stringify(existingResult)}`);
    log(`Dates for non-existent identifier: ${JSON.stringify(nonExistentResult)}`);

    expect(existingResult.lastUpdatedDate).toEqual(date);
    expect(existingResult.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(date.getTime());
    expect(nonExistentResult.lastUpdatedDate).toEqual(new Date(0));
    expect(nonExistentResult.lastAccessedDate).toEqual(new Date(0));
  });
});
