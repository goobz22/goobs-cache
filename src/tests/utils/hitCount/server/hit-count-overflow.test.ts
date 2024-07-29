import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-overflow-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Hit Count Overflow', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Hit Count Overflow tests...');
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

  it('should handle get hit count overflow', async () => {
    log('\nTesting get hit count overflow...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, maxSafeInteger, 0);

    const newGetHitCount = await HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`Get hit count after overflow: ${newGetHitCount}`);
    expect(newGetHitCount).toBe(maxSafeInteger + 1);

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Retrieved get hit count after overflow: ${getHitCount}`);
    expect(getHitCount).toBe(maxSafeInteger + 1);
  });

  it('should handle set hit count overflow', async () => {
    log('\nTesting set hit count overflow...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, maxSafeInteger);

    const newSetHitCount = await HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`Set hit count after overflow: ${newSetHitCount}`);
    expect(newSetHitCount).toBe(maxSafeInteger + 1);

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Retrieved set hit count after overflow: ${setHitCount}`);
    expect(setHitCount).toBe(maxSafeInteger + 1);
  });

  it('should handle setting hit counts beyond safe integer range', async () => {
    log('\nTesting setting hit counts beyond safe integer range...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const exceedMaxSafeInteger = Number.MAX_SAFE_INTEGER + 1;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      exceedMaxSafeInteger,
      exceedMaxSafeInteger,
    );

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count set beyond safe integer range: ${getHitCount}`);
    log(`Set hit count set beyond safe integer range: ${setHitCount}`);
    expect(getHitCount).toBe(exceedMaxSafeInteger);
    expect(setHitCount).toBe(exceedMaxSafeInteger);
  });
});
