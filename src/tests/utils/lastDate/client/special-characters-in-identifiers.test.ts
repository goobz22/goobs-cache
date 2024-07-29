import { getLastUpdatedDate, updateLastUpdatedDate } from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('special-characters-in-identifiers-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Special Characters in Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Special Characters in Identifiers tests...');
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

  it('should handle identifiers with spaces', () => {
    const identifier = 'test identifier';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with spaces: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle identifiers with special characters', () => {
    const specialCharIdentifiers = ['test@id', 'test#id', 'test$id', 'test%id', 'test&id'];
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00.000Z');

    specialCharIdentifiers.forEach((identifier) => {
      updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Retrieved date for identifier "${identifier}": ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(date);
    });
  });

  it('should handle identifiers with Unicode characters', () => {
    const unicodeIdentifiers = ['testİd', 'test🚀id', 'test世界id', 'testid'];
    const storeName = 'testStore';
    const date = new Date('2023-06-17T09:00:00.000Z');

    unicodeIdentifiers.forEach((identifier) => {
      updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Retrieved date for Unicode identifier "${identifier}": ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(date);
    });
  });

  it('should handle identifiers with escape characters', () => {
    const escapeCharIdentifiers = ['test\nid', 'test\tid', 'test\rid', 'test\bid'];
    const storeName = 'testStore';
    const date = new Date('2023-06-18T11:30:00.000Z');

    escapeCharIdentifiers.forEach((identifier) => {
      updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
      log(`Retrieved date for identifier with escape character: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(date);
    });
  });

  it('should handle identifiers with URL-encoded characters', () => {
    const urlEncodedIdentifiers = ['test%20id', 'test%3Aid', 'test%2Fid', 'test%3Fid%3Dvalue'];
    const storeName = 'testStore';
    const date = new Date('2023-06-19T13:15:00.000Z');

    urlEncodedIdentifiers.forEach((identifier) => {
      updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
      log(
        `Retrieved date for URL-encoded identifier "${identifier}": ${retrievedDate.toISOString()}`,
      );
      expect(retrievedDate).toEqual(date);
    });
  });

  it('should handle identifiers with SQL injection attempts', () => {
    const sqlInjectionIdentifiers = ["test'id", 'test"id', 'test;id', 'test--id', 'test/**/id'];
    const storeName = 'testStore';
    const date = new Date('2023-06-20T15:00:00.000Z');

    sqlInjectionIdentifiers.forEach((identifier) => {
      updateLastUpdatedDate(mockSet, identifier, storeName, date);
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, storeName);
      log(
        `Retrieved date for SQL injection attempt identifier "${identifier}": ${retrievedDate.toISOString()}`,
      );
      expect(retrievedDate).toEqual(date);
    });
  });

  it('should handle identifiers with very long names', () => {
    const longIdentifier = 'a'.repeat(1000);
    const storeName = 'testStore';
    const date = new Date('2023-06-21T16:45:00.000Z');

    updateLastUpdatedDate(mockSet, longIdentifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, longIdentifier, storeName);

    log(`Retrieved date for very long identifier: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle identifiers with mixed special characters', () => {
    const mixedCharIdentifier = 'test@id#$%&*()_+{}[]|\\:;"\'<>,.?/`~';
    const storeName = 'testStore';
    const date = new Date('2023-06-22T18:30:00.000Z');

    updateLastUpdatedDate(mockSet, mixedCharIdentifier, storeName, date);
    const retrievedDate = getLastUpdatedDate(mockGet, mixedCharIdentifier, storeName);

    log(`Retrieved date for mixed special character identifier: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });
});
