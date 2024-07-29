import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-identifiers-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Multiple Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Multiple Identifiers tests...');
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

  it('should handle hit counts for multiple identifiers', async () => {
    log('\nTesting hit counts for multiple identifiers...');
    const storeName = 'testStore';
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];

    for (const identifier of identifiers) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const identifier of identifiers) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for identifier ${identifier}:`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should handle hit counts for a large number of identifiers', async () => {
    log('\nTesting hit counts for a large number of identifiers...');
    const storeName = 'testStore';
    const numIdentifiers = 1000;
    const identifiers = Array.from({ length: numIdentifiers }, (_, i) => `id${i}`);

    for (const identifier of identifiers) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const identifier of identifiers) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }

    log(`Tested hit counts for ${numIdentifiers} identifiers successfully`);
  });

  it('should handle hit counts for identifiers with different hit count values', async () => {
    log('\nTesting hit counts for identifiers with different hit count values...');
    const storeName = 'testStore';
    const identifiers = ['id1', 'id2', 'id3'];
    const hitCounts = [
      { getHitCount: 5, setHitCount: 3 },
      { getHitCount: 2, setHitCount: 7 },
      { getHitCount: 10, setHitCount: 1 },
    ];

    for (let i = 0; i < identifiers.length; i++) {
      const identifier = identifiers[i];
      const { getHitCount, setHitCount } = hitCounts[i];
      await HitCountModule.setHitCounts(mockSet, identifier, storeName, getHitCount, setHitCount);
    }

    for (let i = 0; i < identifiers.length; i++) {
      const identifier = identifiers[i];
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for identifier ${identifier}:`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(hitCounts[i].getHitCount);
      expect(setHitCount).toBe(hitCounts[i].setHitCount);
    }
  });
});
