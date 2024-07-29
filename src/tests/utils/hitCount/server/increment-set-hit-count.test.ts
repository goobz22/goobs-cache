import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('increment-set-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Increment Set Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Increment Set Hit Count tests...');
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

  it('should increment set hit count from zero', async () => {
    log('\nTesting set hit count increment from zero...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const newCount = await HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(setHitCount).toBe(1);
  });

  it('should increment set hit count multiple times', async () => {
    log('\nTesting multiple set hit count increments...');
    const identifier = 'testId';
    const storeName = 'testStore';

    for (let i = 1; i <= 5; i++) {
      const newCount = await HitCountModule.incrementSetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      log(`Set hit count after increment ${i}: ${newCount}`);
      expect(newCount).toBe(i);
    }

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(setHitCount).toBe(5);
  });

  it('should increment set hit count from a non-zero value', async () => {
    log('\nTesting set hit count increment from non-zero value...');
    const identifier = 'testId';
    const storeName = 'testStore';

    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 10);

    const newCount = await HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      identifier,
      storeName,
    );
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(11);

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    expect(setHitCount).toBe(11);
  });
});
