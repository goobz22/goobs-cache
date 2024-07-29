import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('large-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Large Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Large Hit Counts tests...');
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

  it('should handle large get hit count values', async () => {
    log('\nTesting with large get hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeGetHitCount = 1000000;

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, largeGetHitCount, 0);
    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Large get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(largeGetHitCount);
  });

  it('should handle large set hit count values', async () => {
    log('\nTesting with large set hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeSetHitCount = 9999999;

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, largeSetHitCount);
    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Large set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(largeSetHitCount);
  });

  it('should handle incrementing large hit count values', async () => {
    log('\nTesting incrementing large hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialGetHitCount = 5000000;
    const initialSetHitCount = 7000000;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      initialGetHitCount,
      initialSetHitCount,
    );
    await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Incremented large get hit count: ${getHitCount}`);
    log(`Incremented large set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(initialGetHitCount + 1);
    expect(setHitCount).toBe(initialSetHitCount + 1);
  });
});
