import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-identifiers-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Multiple Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Multiple Identifiers tests...');
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

  it('should handle multiple identifiers for last updated date', () => {
    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';
    const dates = [
      new Date('2023-06-15T10:30:00.000Z'),
      new Date('2023-06-16T11:30:00.000Z'),
      new Date('2023-06-17T12:30:00.000Z'),
    ];

    identifiers.forEach((id, index) => {
      updateLastUpdatedDate(mockSet, id, storeName, dates[index]);
    });

    identifiers.forEach((id, index) => {
      const retrievedDate = getLastUpdatedDate(mockGet, id, storeName);
      log(`Retrieved last updated date for ${id}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(dates[index]);
    });
  });

  it('should handle multiple identifiers for last accessed date', () => {
    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';
    const dates = [
      new Date('2023-06-18T13:30:00.000Z'),
      new Date('2023-06-19T14:30:00.000Z'),
      new Date('2023-06-20T15:30:00.000Z'),
    ];

    identifiers.forEach((id, index) => {
      updateLastAccessedDate(mockSet, id, storeName, dates[index]);
    });

    identifiers.forEach((id, index) => {
      const retrievedDate = getLastAccessedDate(mockGet, id, storeName);
      log(`Retrieved last accessed date for ${id}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(dates[index]);
    });
  });

  it('should handle multiple identifiers for both last updated and last accessed dates', () => {
    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';
    const updatedDates = [
      new Date('2023-06-21T16:30:00.000Z'),
      new Date('2023-06-22T17:30:00.000Z'),
      new Date('2023-06-23T18:30:00.000Z'),
    ];
    const accessedDates = [
      new Date('2023-06-21T16:35:00.000Z'),
      new Date('2023-06-22T17:35:00.000Z'),
      new Date('2023-06-23T18:35:00.000Z'),
    ];

    identifiers.forEach((id, index) => {
      updateLastDates(mockSet, id, storeName, {
        lastUpdatedDate: updatedDates[index],
        lastAccessedDate: accessedDates[index],
      });
    });

    identifiers.forEach((id, index) => {
      const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, id, storeName);
      log(`Retrieved last updated date for ${id}: ${lastUpdatedDate.toISOString()}`);
      log(`Retrieved last accessed date for ${id}: ${lastAccessedDate.toISOString()}`);
      expect(lastUpdatedDate).toEqual(updatedDates[index]);
      expect(lastAccessedDate).toEqual(accessedDates[index]);
    });
  });

  it('should handle updating specific identifiers without affecting others', () => {
    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';
    const initialDate = new Date('2023-06-24T19:30:00.000Z');
    const updatedDate = new Date('2023-06-25T20:30:00.000Z');

    identifiers.forEach((id) => {
      updateLastUpdatedDate(mockSet, id, storeName, initialDate);
    });

    updateLastUpdatedDate(mockSet, identifiers[1], storeName, updatedDate);

    identifiers.forEach((id, index) => {
      const retrievedDate = getLastUpdatedDate(mockGet, id, storeName);
      log(`Retrieved last updated date for ${id}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(index === 1 ? updatedDate : initialDate);
    });
  });

  it('should handle multiple identifiers with different store names', () => {
    const identifiers = ['id1', 'id2'];
    const storeNames = ['store1', 'store2'];
    const dates = [new Date('2023-06-26T21:30:00.000Z'), new Date('2023-06-27T22:30:00.000Z')];

    identifiers.forEach((id, index) => {
      storeNames.forEach((store) => {
        updateLastUpdatedDate(mockSet, id, store, dates[index]);
      });
    });

    identifiers.forEach((id, idIndex) => {
      storeNames.forEach((store) => {
        const retrievedDate = getLastUpdatedDate(mockGet, id, store);
        log(`Retrieved last updated date for ${id} in ${store}: ${retrievedDate.toISOString()}`);
        expect(retrievedDate).toEqual(dates[idIndex]);
      });
    });
  });
});
