import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-store-names-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Multiple Store Names', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Multiple Store Names tests...');
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

  it('should handle hit counts for multiple store names', async () => {
    log('\nTesting hit counts for multiple store names...');
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];

    for (const storeName of storeNames) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const storeName of storeNames) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for store name ${storeName}:`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should handle hit counts for a large number of store names', async () => {
    log('\nTesting hit counts for a large number of store names...');
    const identifier = 'testId';
    const numStoreNames = 1000;
    const storeNames = Array.from({ length: numStoreNames }, (_, i) => `store${i}`);

    for (const storeName of storeNames) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const storeName of storeNames) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }

    log(`Tested hit counts for ${numStoreNames} store names successfully`);
  });

  it('should handle hit counts for store names with different hit count values', async () => {
    log('\nTesting hit counts for store names with different hit count values...');
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];
    const hitCounts = [
      { getHitCount: 5, setHitCount: 3 },
      { getHitCount: 2, setHitCount: 7 },
      { getHitCount: 10, setHitCount: 1 },
    ];

    for (let i = 0; i < storeNames.length; i++) {
      const storeName = storeNames[i];
      const { getHitCount, setHitCount } = hitCounts[i];
      await HitCountModule.setHitCounts(mockSet, identifier, storeName, getHitCount, setHitCount);
    }

    for (let i = 0; i < storeNames.length; i++) {
      const storeName = storeNames[i];
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for store name ${storeName}:`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(hitCounts[i].getHitCount);
      expect(setHitCount).toBe(hitCounts[i].setHitCount);
    }
  });
});
