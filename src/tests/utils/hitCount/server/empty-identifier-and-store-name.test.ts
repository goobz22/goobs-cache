import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('empty-identifier-and-store-name-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Empty Identifier and Store Name', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Empty Identifier and Store Name tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle empty identifier', async () => {
    log('\nTesting with empty identifier...');
    const emptyIdentifier = '';
    const storeName = 'testStore';

    await expect(
      HitCountModule.getHitCounts(mockGet, emptyIdentifier, storeName),
    ).rejects.toThrow();
    log('getHitCounts rejected with empty identifier');

    await expect(
      HitCountModule.incrementGetHitCount(mockGet, mockSet, emptyIdentifier, storeName),
    ).rejects.toThrow();
    log('incrementGetHitCount rejected with empty identifier');

    await expect(
      HitCountModule.incrementSetHitCount(mockGet, mockSet, emptyIdentifier, storeName),
    ).rejects.toThrow();
    log('incrementSetHitCount rejected with empty identifier');

    await expect(
      HitCountModule.setHitCounts(mockSet, emptyIdentifier, storeName, 1, 1),
    ).rejects.toThrow();
    log('setHitCounts rejected with empty identifier');
  });

  it('should handle empty store name', async () => {
    log('\nTesting with empty store name...');
    const identifier = 'testId';
    const emptyStoreName = '';

    await expect(
      HitCountModule.getHitCounts(mockGet, identifier, emptyStoreName),
    ).rejects.toThrow();
    log('getHitCounts rejected with empty store name');

    await expect(
      HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, emptyStoreName),
    ).rejects.toThrow();
    log('incrementGetHitCount rejected with empty store name');

    await expect(
      HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, emptyStoreName),
    ).rejects.toThrow();
    log('incrementSetHitCount rejected with empty store name');

    await expect(
      HitCountModule.setHitCounts(mockSet, identifier, emptyStoreName, 1, 1),
    ).rejects.toThrow();
    log('setHitCounts rejected with empty store name');
  });

  it('should handle empty identifier and store name', async () => {
    log('\nTesting with empty identifier and store name...');
    const emptyIdentifier = '';
    const emptyStoreName = '';

    await expect(
      HitCountModule.getHitCounts(mockGet, emptyIdentifier, emptyStoreName),
    ).rejects.toThrow();
    log('getHitCounts rejected with empty identifier and store name');

    await expect(
      HitCountModule.incrementGetHitCount(mockGet, mockSet, emptyIdentifier, emptyStoreName),
    ).rejects.toThrow();
    log('incrementGetHitCount rejected with empty identifier and store name');

    await expect(
      HitCountModule.incrementSetHitCount(mockGet, mockSet, emptyIdentifier, emptyStoreName),
    ).rejects.toThrow();
    log('incrementSetHitCount rejected with empty identifier and store name');

    await expect(
      HitCountModule.setHitCounts(mockSet, emptyIdentifier, emptyStoreName, 1, 1),
    ).rejects.toThrow();
    log('setHitCounts rejected with empty identifier and store name');
  });
});
