import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('integration-with-cache-system-test.log');
const log = createLogger(logStream);

class MockCacheSystem {
  private storage: { [key: string]: string } = {};

  get(key: string): string | null {
    return this.storage[key] || null;
  }

  set(key: string, value: string): void {
    this.storage[key] = value;
  }

  clear(): void {
    this.storage = {};
  }
}

describe('Hit Count Client Utilities - Integration with Cache System', () => {
  let mockCache: MockCacheSystem;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Integration with Cache System tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockCache = new MockCacheSystem();
  });

  afterAll(() => {
    logStream.end();
  });

  it('should integrate with cache system for get hit count', () => {
    log('\nTesting integration with cache system for get hit count...');

    const newCount = HitCountModule.incrementGetHitCount(
      mockCache.get.bind(mockCache),
      mockCache.set.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { getHitCount } = HitCountModule.getHitCounts(
      mockCache.get.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`Retrieved get hit count from cache: ${getHitCount}`);
    expect(getHitCount).toBe(1);
  });

  it('should integrate with cache system for set hit count', () => {
    log('\nTesting integration with cache system for set hit count...');

    const newCount = HitCountModule.incrementSetHitCount(
      mockCache.get.bind(mockCache),
      mockCache.set.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { setHitCount } = HitCountModule.getHitCounts(
      mockCache.get.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`Retrieved set hit count from cache: ${setHitCount}`);
    expect(setHitCount).toBe(1);
  });

  it('should persist hit counts in cache system', () => {
    log('\nTesting persistence of hit counts in cache system...');

    HitCountModule.incrementGetHitCount(
      mockCache.get.bind(mockCache),
      mockCache.set.bind(mockCache),
      'testId',
      'testStore',
    );

    HitCountModule.incrementSetHitCount(
      mockCache.get.bind(mockCache),
      mockCache.set.bind(mockCache),
      'testId',
      'testStore',
    );

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockCache.get.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle multiple cache operations', () => {
    log('\nTesting multiple cache operations...');

    for (let i = 0; i < 5; i++) {
      HitCountModule.incrementGetHitCount(
        mockCache.get.bind(mockCache),
        mockCache.set.bind(mockCache),
        'testId',
        'testStore',
      );
    }

    for (let i = 0; i < 3; i++) {
      HitCountModule.incrementSetHitCount(
        mockCache.get.bind(mockCache),
        mockCache.set.bind(mockCache),
        'testId',
        'testStore',
      );
    }

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockCache.get.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`Final get hit count: ${getHitCount}`);
    log(`Final set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(3);
  });

  it('should handle cache clearing', () => {
    log('\nTesting hit count behavior after cache clearing...');

    HitCountModule.incrementGetHitCount(
      mockCache.get.bind(mockCache),
      mockCache.set.bind(mockCache),
      'testId',
      'testStore',
    );

    mockCache.clear();

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockCache.get.bind(mockCache),
      'testId',
      'testStore',
    );

    log(`Get hit count after cache clear: ${getHitCount}`);
    log(`Set hit count after cache clear: ${setHitCount}`);

    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });
});
