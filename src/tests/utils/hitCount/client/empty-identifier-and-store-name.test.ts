import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('empty-identifier-and-store-name-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Empty Identifier and Store Name', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Empty Identifier and Store Name tests...');
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

  it('should handle empty identifier', () => {
    log('\nTesting with empty identifier...');
    const emptyId = '';
    const storeName = 'testStore';

    const newGetCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, emptyId, storeName);
    const newSetCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, emptyId, storeName);

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, emptyId, storeName);

    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle empty store name', () => {
    log('\nTesting with empty store name...');
    const identifier = 'testId';
    const emptyStore = '';

    const newGetCount = HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      identifier,
      emptyStore,
    );
    const newSetCount = HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      identifier,
      emptyStore,
    );

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      emptyStore,
    );

    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle both empty identifier and store name', () => {
    log('\nTesting with both empty identifier and store name...');
    const emptyId = '';
    const emptyStore = '';

    const newGetCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, emptyId, emptyStore);
    const newSetCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, emptyId, emptyStore);

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, emptyId, emptyStore);

    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle setting hit counts with empty identifier and store name', () => {
    log('\nTesting setting hit counts with empty identifier and store name...');
    const emptyId = '';
    const emptyStore = '';

    HitCountModule.setHitCounts(mockSet, emptyId, emptyStore, 5, 10);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, emptyId, emptyStore);

    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);
  });
});
