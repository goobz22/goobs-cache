import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('zero-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Zero Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Zero Hit Counts tests...');
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

  it('should initialize hit counts to zero', async () => {
    log('\nTesting hit count initialization to zero...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Initial get hit count: ${getHitCount}`);
    log(`Initial set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle zero hit counts after increments', async () => {
    log('\nTesting zero hit counts after increments...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count after increment: ${getHitCount}`);
    log(`Set hit count after increment: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 0);

    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Get hit count after setting to zero: ${getHitCount}`);
    log(`Set hit count after setting to zero: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle incrementing from zero hit counts', async () => {
    log('\nTesting incrementing from zero hit counts...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 0);

    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Initial get hit count: ${getHitCount}`);
    log(`Initial set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);

    await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Get hit count after incrementing from zero: ${getHitCount}`);
    log(`Set hit count after incrementing from zero: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle zero hit counts for multiple identifiers and store names', async () => {
    log('\nTesting zero hit counts for multiple identifiers and store names...');
    const identifiers = ['id1', 'id2', 'id3'];
    const storeNames = ['store1', 'store2', 'store3'];

    for (const identifier of identifiers) {
      for (const storeName of storeNames) {
        const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
          mockGet,
          identifier,
          storeName,
        );
        log(
          `Get hit count for identifier "${identifier}" and store name "${storeName}": ${getHitCount}`,
        );
        log(
          `Set hit count for identifier "${identifier}" and store name "${storeName}": ${setHitCount}`,
        );
        expect(getHitCount).toBe(0);
        expect(setHitCount).toBe(0);
      }
    }
  });
});
