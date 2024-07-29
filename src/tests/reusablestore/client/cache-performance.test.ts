import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('cache-performance-test.log');
const log = createLogger(logStream);

describe('Cache Performance Tests', () => {
  const modes: CacheMode[] = ['client', 'cookie'];
  const storeName = 'performance-test-store';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Cache Performance tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const measureOperationTime = async (operation: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await operation();
    const end = performance.now();
    return end - start;
  };

  it('should measure set operation performance', async () => {
    const iterations = 1000;
    const testValue: StringValue = { type: 'string', value: 'test-value' };

    for (const mode of modes) {
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const identifier = `set-test-${i}`;
        const time = await measureOperationTime(async () => {
          await clientSet(identifier, storeName, testValue, expirationDate, mode);
        });
        times.push(time);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      log(`Average set operation time for ${mode} mode: ${averageTime.toFixed(3)}ms`);
      expect(averageTime).toBeLessThan(10); // Assuming 10ms is an acceptable threshold
    }
  });

  it('should measure get operation performance', async () => {
    const iterations = 1000;
    const testValue: StringValue = { type: 'string', value: 'test-value' };

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const identifier = `get-test-${i}`;
        const time = await measureOperationTime(async () => {
          await clientGet(identifier, storeName, mode);
        });
        times.push(time);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      log(`Average get operation time for ${mode} mode: ${averageTime.toFixed(3)}ms`);
      expect(averageTime).toBeLessThan(5); // Assuming 5ms is an acceptable threshold
    }
  });

  it('should measure remove operation performance', async () => {
    const iterations = 1000;

    for (const mode of modes) {
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const identifier = `remove-test-${i}`;
        const time = await measureOperationTime(async () => {
          await clientRemove(identifier, storeName, mode);
        });
        times.push(time);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      log(`Average remove operation time for ${mode} mode: ${averageTime.toFixed(3)}ms`);
      expect(averageTime).toBeLessThan(5); // Assuming 5ms is an acceptable threshold
    }
  });

  it('should measure performance with increasing data size', async () => {
    const dataSizes = [100, 1000, 10000, 100000];

    for (const mode of modes) {
      for (const size of dataSizes) {
        const identifier = `size-test-${size}`;
        const testValue: StringValue = { type: 'string', value: 'a'.repeat(size) };

        (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

        const setTime = await measureOperationTime(async () => {
          await clientSet(identifier, storeName, testValue, expirationDate, mode);
        });

        const getTime = await measureOperationTime(async () => {
          await clientGet(identifier, storeName, mode);
        });

        log(`Performance for ${mode} mode with ${size} bytes:`);
        log(`  Set time: ${setTime.toFixed(3)}ms`);
        log(`  Get time: ${getTime.toFixed(3)}ms`);

        expect(setTime).toBeLessThan(50); // Adjust threshold based on actual performance
        expect(getTime).toBeLessThan(25); // Adjust threshold based on actual performance
      }
    }
  });

  it('should measure performance under concurrent operations', async () => {
    const concurrentOperations = 100;

    for (const mode of modes) {
      const testValue: StringValue = { type: 'string', value: 'concurrent-test-value' };
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      const operations = Array(concurrentOperations)
        .fill(null)
        .map((_, index) => {
          const identifier = `concurrent-test-${index}`;
          return async () => {
            await clientSet(identifier, storeName, testValue, expirationDate, mode);
            await clientGet(identifier, storeName, mode);
            await clientRemove(identifier, storeName, mode);
          };
        });

      const startTime = performance.now();
      await Promise.all(operations.map((op) => op()));
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      log(
        `Total time for ${concurrentOperations} concurrent operations in ${mode} mode: ${totalTime.toFixed(3)}ms`,
      );
      expect(totalTime).toBeLessThan(1000); // Assuming 1 second is an acceptable threshold for 100 concurrent operations
    }
  });
});
