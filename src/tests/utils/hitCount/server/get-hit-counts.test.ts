import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('get-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Get Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Get Hit Counts tests...');
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

  it('should return zero hit counts for non-existent keys', async () => {
    log('\nTesting get hit counts for non-existent keys...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count for non-existent key: ${getHitCount}`);
    log(`Set hit count for non-existent key: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should return correct hit counts for existing keys', async () => {
    log('\nTesting get hit counts for existing keys...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialGetHitCount = 5;
    const initialSetHitCount = 3;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      initialGetHitCount,
      initialSetHitCount,
    );

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count for existing key: ${getHitCount}`);
    log(`Set hit count for existing key: ${setHitCount}`);
    expect(getHitCount).toBe(initialGetHitCount);
    expect(setHitCount).toBe(initialSetHitCount);
  });

  it('should handle large hit count values', async () => {
    log('\nTesting get hit counts with large values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeGetHitCount = 1000000;
    const largeSetHitCount = 9999999;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      largeGetHitCount,
      largeSetHitCount,
    );

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count with large value: ${getHitCount}`);
    log(`Set hit count with large value: ${setHitCount}`);
    expect(getHitCount).toBe(largeGetHitCount);
    expect(setHitCount).toBe(largeSetHitCount);
  });
});
