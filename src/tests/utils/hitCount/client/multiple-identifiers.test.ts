import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-identifiers-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Multiple Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Multiple Identifiers tests...');
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

  it('should handle incrementing hit counts for multiple identifiers', () => {
    log('\nTesting incrementing hit counts for multiple identifiers...');

    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';

    for (const id of identifiers) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, id, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, id, storeName);
    }

    for (const id of identifiers) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, storeName);
      log(`${id} - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should maintain separate hit counts for different identifiers', () => {
    log('\nTesting separate hit counts for different identifiers...');

    const storeName = 'testStore';
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', storeName);
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', storeName);

    const counts1 = HitCountModule.getHitCounts(mockGet, 'id1', storeName);
    const counts2 = HitCountModule.getHitCounts(mockGet, 'id2', storeName);

    log(`id1 - Get hit count: ${counts1.getHitCount}, Set hit count: ${counts1.setHitCount}`);
    log(`id2 - Get hit count: ${counts2.getHitCount}, Set hit count: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(2);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(3);
  });

  it('should handle a large number of identifiers', () => {
    log('\nTesting handling of a large number of identifiers...');

    const identifierCount = 10000;
    const storeName = 'testStore';

    for (let i = 0; i < identifierCount; i++) {
      const id = `id${i}`;
      HitCountModule.incrementGetHitCount(mockGet, mockSet, id, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, id, storeName);
    }

    let totalGetCount = 0;
    let totalSetCount = 0;

    for (let i = 0; i < identifierCount; i++) {
      const id = `id${i}`;
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, storeName);
      totalGetCount += getHitCount;
      totalSetCount += setHitCount;
    }

    log(`Total get hit count across ${identifierCount} identifiers: ${totalGetCount}`);
    log(`Total set hit count across ${identifierCount} identifiers: ${totalSetCount}`);

    expect(totalGetCount).toBe(identifierCount);
    expect(totalSetCount).toBe(identifierCount);
  });

  it('should handle identifiers with special characters', () => {
    log('\nTesting identifiers with special characters...');

    const specialIdentifiers = ['id:1', 'id#2', 'id@3', 'id%4', 'id&5'];
    const storeName = 'testStore';

    for (const id of specialIdentifiers) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, id, storeName);
      HitCountModule.incrementSetHitCount(mockGet, mockSet, id, storeName);
    }

    for (const id of specialIdentifiers) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, storeName);
      log(`${id} - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should handle very long identifier strings', () => {
    log('\nTesting very long identifier strings...');

    const longIdentifier = 'a'.repeat(1000);
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, longIdentifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, longIdentifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      longIdentifier,
      storeName,
    );
    log(`Long identifier - Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });
});
