import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-persistence-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Hit Count Persistence', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Hit Count Persistence tests...');
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

  it('should persist hit counts across multiple get operations', async () => {
    log('\nTesting hit count persistence across multiple get operations...');
    const identifier = 'testId';
    const storeName = 'testStore';

    for (let i = 1; i <= 5; i++) {
      const getHitCount = await HitCountModule.incrementGetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      log(`Get hit count after increment ${i}: ${getHitCount}`);
      expect(getHitCount).toBe(i);
    }

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Final get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(5);
  });

  it('should persist hit counts across multiple set operations', async () => {
    log('\nTesting hit count persistence across multiple set operations...');
    const identifier = 'testId';
    const storeName = 'testStore';

    for (let i = 1; i <= 5; i++) {
      const setHitCount = await HitCountModule.incrementSetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      log(`Set hit count after increment ${i}: ${setHitCount}`);
      expect(setHitCount).toBe(i);
    }

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, identifier, storeName);
    log(`Final set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(5);
  });

  it('should persist hit counts across multiple get and set operations', async () => {
    log('\nTesting hit count persistence across multiple get and set operations...');
    const identifier = 'testId';
    const storeName = 'testStore';

    for (let i = 1; i <= 3; i++) {
      const getHitCount = await HitCountModule.incrementGetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      const setHitCount = await HitCountModule.incrementSetHitCount(
        mockGet,
        mockSet,
        identifier,
        storeName,
      );
      log(`Get hit count after increment ${i}: ${getHitCount}`);
      log(`Set hit count after increment ${i}: ${setHitCount}`);
      expect(getHitCount).toBe(i);
      expect(setHitCount).toBe(i);
    }

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Final get hit count: ${getHitCount}`);
    log(`Final set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(3);
    expect(setHitCount).toBe(3);
  });
});
