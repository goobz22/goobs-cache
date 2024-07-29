import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('set-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Set Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Set Hit Counts tests...');
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

  it('should set hit counts to specified values', async () => {
    log('\nTesting setting hit counts to specified values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const getHitCount = 10;
    const setHitCount = 20;

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, getHitCount, setHitCount);

    const result = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Get hit count: ${result.getHitCount}`);
    log(`Set hit count: ${result.setHitCount}`);
    expect(result.getHitCount).toBe(getHitCount);
    expect(result.setHitCount).toBe(setHitCount);
  });

  it('should overwrite existing hit counts', async () => {
    log('\nTesting overwriting existing hit counts...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 5, 5);
    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 15, 25);

    const result = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Get hit count: ${result.getHitCount}`);
    log(`Set hit count: ${result.setHitCount}`);
    expect(result.getHitCount).toBe(15);
    expect(result.setHitCount).toBe(25);
  });

  it('should handle setting hit counts to zero', async () => {
    log('\nTesting setting hit counts to zero...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 100, 200);
    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 0);

    const result = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Get hit count: ${result.getHitCount}`);
    log(`Set hit count: ${result.setHitCount}`);
    expect(result.getHitCount).toBe(0);
    expect(result.setHitCount).toBe(0);
  });

  it('should handle setting large hit count values', async () => {
    log('\nTesting setting large hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const largeGetHitCount = 1000000;
    const largeSetHitCount = 2000000;

    await HitCountModule.setHitCounts(
      mockSet,
      identifier,
      storeName,
      largeGetHitCount,
      largeSetHitCount,
    );

    const result = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Get hit count: ${result.getHitCount}`);
    log(`Set hit count: ${result.setHitCount}`);
    expect(result.getHitCount).toBe(largeGetHitCount);
    expect(result.setHitCount).toBe(largeSetHitCount);
  });
});
