import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('increment-get-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Increment Get Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Increment Get Hit Count tests...');
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

  it('should increment get hit count from zero', async () => {
    log('\nTesting get hit count increment from zero...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const newCount = await HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(getHitCount).toBe(1);
  });

  it('should increment get hit count multiple times', async () => {
    log('\nTesting multiple get hit count increments...');
    const identifier = 'testId';
    const storeName = 'testStore';

    for (let i = 1; i <= 5; i++) {
      const newCount = await HitCountModule.incrementGetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      log(`Get hit count after increment ${i}: ${newCount}`);
      expect(newCount).toBe(i);
    }

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(getHitCount).toBe(5);
  });

  it('should increment get hit count from a non-zero value', async () => {
    log('\nTesting get hit count increment from non-zero value...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 10, 0);

    const newCount = await HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(11);

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(getHitCount).toBe(11);
  });
});
