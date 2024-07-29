import { set, get, remove } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-performance-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Performance Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

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

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should perform fast set operations in ${mode} mode`, async () => {
        const identifier = `set-performance-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);

        const setTime = await measureOperationTime(async () => {
          await set(identifier, storeName, value, mode);
        });

        expect(setTime).toBeLessThan(100); // Assuming 100ms is an acceptable threshold
        log(`Set operation in ${mode} mode took ${setTime.toFixed(2)}ms`);
      });

      it(`should perform fast get operations in ${mode} mode`, async () => {
        const identifier = `get-performance-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (get as jest.Mock).mockResolvedValue({ value });

        const getTime = await measureOperationTime(async () => {
          await get(identifier, storeName, mode);
        });

        expect(getTime).toBeLessThan(50); // Assuming 50ms is an acceptable threshold
        log(`Get operation in ${mode} mode took ${getTime.toFixed(2)}ms`);
      });

      it(`should perform fast remove operations in ${mode} mode`, async () => {
        const identifier = `remove-performance-${mode}`;

        (remove as jest.Mock).mockResolvedValue(undefined);

        const removeTime = await measureOperationTime(async () => {
          await remove(identifier, storeName, mode);
        });

        expect(removeTime).toBeLessThan(50); // Assuming 50ms is an acceptable threshold
        log(`Remove operation in ${mode} mode took ${removeTime.toFixed(2)}ms`);
      });

      it(`should handle multiple concurrent operations efficiently in ${mode} mode`, async () => {
        const operationCount = 100;
        const identifiers = Array.from(
          { length: operationCount },
          (_, i) => `concurrent-${i}-${mode}`,
        );
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });
        (remove as jest.Mock).mockResolvedValue(undefined);

        const concurrentTime = await measureOperationTime(async () => {
          await Promise.all([
            ...identifiers.map((id) => set(id, storeName, value, mode)),
            ...identifiers.map((id) => get(id, storeName, mode)),
            ...identifiers.map((id) => remove(id, storeName, mode)),
          ]);
        });

        const averageTime = concurrentTime / (operationCount * 3);
        expect(averageTime).toBeLessThan(10); // Assuming 10ms per operation is acceptable
        log(
          `Average time per operation in ${mode} mode with ${operationCount} concurrent operations: ${averageTime.toFixed(2)}ms`,
        );
      });

      it(`should handle large data efficiently in ${mode} mode`, async () => {
        const identifier = `large-data-${mode}`;
        const largeValue: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024) }; // 1MB string

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value: largeValue });

        const setTime = await measureOperationTime(async () => {
          await set(identifier, storeName, largeValue, mode);
        });

        const getTime = await measureOperationTime(async () => {
          await get(identifier, storeName, mode);
        });

        expect(setTime).toBeLessThan(500); // Assuming 500ms is acceptable for 1MB
        expect(getTime).toBeLessThan(200); // Assuming 200ms is acceptable for 1MB
        log(`Large data set operation in ${mode} mode took ${setTime.toFixed(2)}ms`);
        log(`Large data get operation in ${mode} mode took ${getTime.toFixed(2)}ms`);
      });
    });
  });

  const measureOperationTime = async (operation: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await operation();
    return performance.now() - start;
  };

  it('should compare performance across different cache modes', async () => {
    const identifier = 'cross-mode-performance';
    const value: StringValue = { type: 'string', value: 'test value' };
    const results: Record<CacheMode, { set: number; get: number; remove: number }> = {} as Record<
      CacheMode,
      { set: number; get: number; remove: number }
    >;

    for (const mode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      (get as jest.Mock).mockResolvedValue({ value });
      (remove as jest.Mock).mockResolvedValue(undefined);

      results[mode] = {
        set: await measureOperationTime(() => set(identifier, storeName, value, mode)),
        get: await measureOperationTime(async () => {
          await get(identifier, storeName, mode);
        }),
        remove: await measureOperationTime(() => remove(identifier, storeName, mode)),
      };
    }

    // Log results
    for (const mode of modes) {
      log(`${mode} mode performance:
        Set: ${results[mode].set.toFixed(2)}ms
        Get: ${results[mode].get.toFixed(2)}ms
        Remove: ${results[mode].remove.toFixed(2)}ms`);
    }

    // Compare performances (example assertion, adjust as needed)
    const fastestSet = Math.min(...modes.map((mode) => results[mode].set));
    const fastestGet = Math.min(...modes.map((mode) => results[mode].get));
    const fastestRemove = Math.min(...modes.map((mode) => results[mode].remove));

    expect(fastestSet).toBeLessThan(100);
    expect(fastestGet).toBeLessThan(50);
    expect(fastestRemove).toBeLessThan(50);
  });
});
