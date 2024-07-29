import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('maximum-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Maximum Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Maximum Hit Count tests...');
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

  it('should handle maximum hit count values', async () => {
    log('\nTesting with maximum hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      maxSafeInteger,
      maxSafeInteger,
    );
    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Maximum get hit count: ${getHitCount}`);
    log(`Maximum set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(maxSafeInteger);
    expect(setHitCount).toBe(maxSafeInteger);
  });

  it('should handle incrementing maximum hit count values', async () => {
    log('\nTesting incrementing maximum hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      maxSafeInteger,
      maxSafeInteger,
    );
    await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Incremented maximum get hit count: ${getHitCount}`);
    log(`Incremented maximum set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(maxSafeInteger + 1);
    expect(setHitCount).toBe(maxSafeInteger + 1);
  });

  it('should handle setting hit counts beyond maximum safe integer', async () => {
    log('\nTesting setting hit counts beyond maximum safe integer...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const beyondMaxSafeInteger = Number.MAX_SAFE_INTEGER + 1;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      beyondMaxSafeInteger,
      beyondMaxSafeInteger,
    );
    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count beyond maximum safe integer: ${getHitCount}`);
    log(`Set hit count beyond maximum safe integer: ${setHitCount}`);
    expect(getHitCount).toBe(beyondMaxSafeInteger);
    expect(setHitCount).toBe(beyondMaxSafeInteger);
  });
});
