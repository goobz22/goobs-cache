import { set, get, remove } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-scalability-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Scalability Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Cache Scalability tests...');
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
    return performance.now() - start;
  };

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should handle a large number of set operations in ${mode} mode`, async () => {
        const operationCount = 1000;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);

        const totalTime = await measureOperationTime(async () => {
          await Promise.all(
            Array.from({ length: operationCount }, (_, i) =>
              set(`large-set-${i}`, storeName, value, mode),
            ),
          );
        });

        const averageTime = totalTime / operationCount;
        expect(averageTime).toBeLessThan(1); // Assuming 1ms per operation is acceptable
        log(
          `Average time per set operation in ${mode} mode with ${operationCount} operations: ${averageTime.toFixed(2)}ms`,
        );
      });

      it(`should handle a large number of get operations in ${mode} mode`, async () => {
        const operationCount = 1000;
        const value: StringValue = { type: 'string', value: 'test value' };

        (get as jest.Mock).mockResolvedValue({ value });

        const totalTime = await measureOperationTime(async () => {
          await Promise.all(
            Array.from({ length: operationCount }, (_, i) =>
              get(`large-get-${i}`, storeName, mode),
            ),
          );
        });

        const averageTime = totalTime / operationCount;
        expect(averageTime).toBeLessThan(0.5); // Assuming 0.5ms per operation is acceptable
        log(
          `Average time per get operation in ${mode} mode with ${operationCount} operations: ${averageTime.toFixed(2)}ms`,
        );
      });

      it(`should handle a large number of remove operations in ${mode} mode`, async () => {
        const operationCount = 1000;

        (remove as jest.Mock).mockResolvedValue(undefined);

        const totalTime = await measureOperationTime(async () => {
          await Promise.all(
            Array.from({ length: operationCount }, (_, i) =>
              remove(`large-remove-${i}`, storeName, mode),
            ),
          );
        });

        const averageTime = totalTime / operationCount;
        expect(averageTime).toBeLessThan(0.5); // Assuming 0.5ms per operation is acceptable
        log(
          `Average time per remove operation in ${mode} mode with ${operationCount} operations: ${averageTime.toFixed(2)}ms`,
        );
      });

      it(`should maintain performance with increasing data size in ${mode} mode`, async () => {
        const sizes = [1024, 1024 * 10, 1024 * 100, 1024 * 1000]; // 1KB to 1MB
        const results: number[] = [];

        for (const size of sizes) {
          const value: StringValue = { type: 'string', value: 'a'.repeat(size) };

          (set as jest.Mock).mockResolvedValue(undefined);
          (get as jest.Mock).mockResolvedValue({ value });

          const setTime = await measureOperationTime(async () => {
            await set(`large-data-${size}`, storeName, value, mode);
          });

          const getTime = await measureOperationTime(async () => {
            await get(`large-data-${size}`, storeName, mode);
          });

          results.push(setTime + getTime);
        }

        // Check if performance degrades linearly or better
        for (let i = 1; i < results.length; i++) {
          const ratio = results[i] / results[i - 1];
          expect(ratio).toBeLessThan(10); // Assuming a 10x increase is acceptable for a 10x increase in data size
        }

        log(
          `Performance with increasing data size in ${mode} mode: ${results.map((t) => t.toFixed(2)).join(', ')}ms`,
        );
      });

      it(`should handle concurrent mixed operations efficiently in ${mode} mode`, async () => {
        const operationCount = 1000;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });
        (remove as jest.Mock).mockResolvedValue(undefined);

        const totalTime = await measureOperationTime(async () => {
          await Promise.all([
            ...Array.from({ length: operationCount }, (_, i) =>
              set(`mixed-${i}`, storeName, value, mode),
            ),
            ...Array.from({ length: operationCount }, (_, i) => get(`mixed-${i}`, storeName, mode)),
            ...Array.from({ length: operationCount }, (_, i) =>
              remove(`mixed-${i}`, storeName, mode),
            ),
          ]);
        });

        const averageTime = totalTime / (operationCount * 3);
        expect(averageTime).toBeLessThan(1); // Assuming 1ms per operation is acceptable
        log(
          `Average time per operation in ${mode} mode with ${operationCount * 3} mixed concurrent operations: ${averageTime.toFixed(2)}ms`,
        );
      });
    });
  });

  it('should compare scalability across different cache modes', async () => {
    const operationCounts = [100, 1000, 10000];
    const results: Record<CacheMode, number[]> = {} as Record<CacheMode, number[]>;
    const value: StringValue = { type: 'string', value: 'test value' };

    for (const mode of modes) {
      results[mode] = [];
      for (const count of operationCounts) {
        (set as jest.Mock).mockResolvedValue(undefined);

        const totalTime = await measureOperationTime(async () => {
          await Promise.all(
            Array.from({ length: count }, (_, i) =>
              set(`scalability-${i}`, storeName, value, mode),
            ),
          );
        });

        results[mode].push(totalTime / count);
      }
    }

    // Log results
    for (const mode of modes) {
      log(`${mode} mode scalability:
        100 ops: ${results[mode][0].toFixed(2)}ms per op
        1000 ops: ${results[mode][1].toFixed(2)}ms per op
        10000 ops: ${results[mode][2].toFixed(2)}ms per op`);
    }

    // Compare scalability
    for (const mode of modes) {
      const scalabilityRatio = results[mode][2] / results[mode][0];
      expect(scalabilityRatio).toBeLessThan(10);
      log(`${mode} mode scalability ratio (10000 ops vs 100 ops): ${scalabilityRatio.toFixed(2)}`);
    }

    // Find the most scalable mode
    const scalabilityRatios = modes.map((mode) => results[mode][2] / results[mode][0]);
    const mostScalableMode = modes[scalabilityRatios.indexOf(Math.min(...scalabilityRatios))];
    log(`Most scalable mode: ${mostScalableMode}`);

    // Check if any mode significantly outperforms others
    const averageTimes = modes.map((mode) => results[mode][2]); // Compare at 10000 ops
    const fastestTime = Math.min(...averageTimes);
    const slowestTime = Math.max(...averageTimes);
    const performanceRatio = slowestTime / fastestTime;

    if (performanceRatio > 2) {
      log(
        `Significant performance difference detected. Slowest/Fastest ratio: ${performanceRatio.toFixed(2)}`,
      );
    } else {
      log('All modes perform similarly under high load.');
    }

    // Final assertions
    expect(Math.max(...scalabilityRatios)).toBeLessThan(20); // Assuming a 20x increase is the upper limit for 100x more operations
    expect(performanceRatio).toBeLessThan(5); // Assuming a 5x difference between modes is the upper limit
  });
});
