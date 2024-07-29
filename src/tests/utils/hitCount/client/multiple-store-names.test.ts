import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-store-names-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Multiple Store Names', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Multiple Store Names tests...');
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

  it('should handle incrementing hit counts for multiple store names', () => {
    log('\nTesting incrementing hit counts for multiple store names...');

    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];

    for (const storeName of storeNames) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const storeName of storeNames) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`${storeName} - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should maintain separate hit counts for different store names', () => {
    log('\nTesting separate hit counts for different store names...');

    const identifier = 'testId';
    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, 'store1');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, 'store1');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, 'store2');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, 'store2');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, 'store2');

    const counts1 = HitCountModule.getHitCounts(mockGet, identifier, 'store1');
    const counts2 = HitCountModule.getHitCounts(mockGet, identifier, 'store2');

    log(`store1 - Get hit count: ${counts1.getHitCount}, Set hit count: ${counts1.setHitCount}`);
    log(`store2 - Get hit count: ${counts2.getHitCount}, Set hit count: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(2);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(3);
  });

  it('should handle a large number of store names', () => {
    log('\nTesting handling of a large number of store names...');

    const storeNameCount = 10000;
    const identifier = 'testId';

    for (let i = 0; i < storeNameCount; i++) {
      const storeName = `store${i}`;
      HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    let totalGetCount = 0;
    let totalSetCount = 0;

    for (let i = 0; i < storeNameCount; i++) {
      const storeName = `store${i}`;
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      totalGetCount += getHitCount;
      totalSetCount += setHitCount;
    }

    log(`Total get hit count across ${storeNameCount} store names: ${totalGetCount}`);
    log(`Total set hit count across ${storeNameCount} store names: ${totalSetCount}`);

    expect(totalGetCount).toBe(storeNameCount);
    expect(totalSetCount).toBe(storeNameCount);
  });

  it('should handle store names with special characters', () => {
    log('\nTesting store names with special characters...');

    const specialStoreNames = ['store:1', 'store#2', 'store@3', 'store%4', 'store&5'];
    const identifier = 'testId';

    for (const storeName of specialStoreNames) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const storeName of specialStoreNames) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`${storeName} - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should handle very long store name strings', () => {
    log('\nTesting very long store name strings...');

    const longStoreName = 'a'.repeat(1000);
    const identifier = 'testId';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, longStoreName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, longStoreName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      longStoreName,
    );
    log(`Long store name - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });
});
