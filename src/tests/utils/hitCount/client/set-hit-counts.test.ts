import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('set-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Set Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Set Hit Counts tests...');
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

  it('should set hit counts correctly', () => {
    log('\nTesting setting hit counts...');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 5, 10);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);
  });

  it('should overwrite existing hit counts', () => {
    log('\nTesting overwriting existing hit counts...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 100, 200);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(100);
    expect(setHitCount).toBe(200);
  });

  it('should handle setting hit counts to zero', () => {
    log('\nTesting setting hit counts to zero...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle setting very large hit counts', () => {
    log('\nTesting setting very large hit counts...');

    const largeNumber = Number.MAX_SAFE_INTEGER;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeNumber, largeNumber);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(largeNumber);
    expect(setHitCount).toBe(largeNumber);
  });

  it('should set hit counts for multiple identifier and store name combinations', () => {
    log('\nTesting setting hit counts for multiple identifier and store name combinations...');

    HitCountModule.setHitCounts(mockSet, 'id1', 'store1', 1, 2);
    HitCountModule.setHitCounts(mockSet, 'id1', 'store2', 3, 4);
    HitCountModule.setHitCounts(mockSet, 'id2', 'store1', 5, 6);

    const counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'store1');
    const counts2 = HitCountModule.getHitCounts(mockGet, 'id1', 'store2');
    const counts3 = HitCountModule.getHitCounts(mockGet, 'id2', 'store1');

    log(
      `id1, store1 - Get hit count: ${counts1.getHitCount}, Set hit count: ${counts1.setHitCount}`,
    );
    log(
      `id1, store2 - Get hit count: ${counts2.getHitCount}, Set hit count: ${counts2.setHitCount}`,
    );
    log(
      `id2, store1 - Get hit count: ${counts3.getHitCount}, Set hit count: ${counts3.setHitCount}`,
    );

    expect(counts1.getHitCount).toBe(1);
    expect(counts1.setHitCount).toBe(2);
    expect(counts2.getHitCount).toBe(3);
    expect(counts2.setHitCount).toBe(4);
    expect(counts3.getHitCount).toBe(5);
    expect(counts3.setHitCount).toBe(6);
  });

  it('should handle setting hit counts with empty strings as identifier and store name', () => {
    log('\nTesting setting hit counts with empty strings as identifier and store name...');

    HitCountModule.setHitCounts(mockSet, '', '', 42, 84);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, '', '');
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(42);
    expect(setHitCount).toBe(84);
  });
});
