import { set, get, remove } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('concurrency-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Concurrency Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Concurrency Handling tests...');
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
      it(`should handle concurrent set operations in ${mode} mode`, async () => {
        const identifier = `concurrent-set-${mode}`;
        const values: StringValue[] = [
          { type: 'string', value: 'value1' },
          { type: 'string', value: 'value2' },
          { type: 'string', value: 'value3' },
        ];

        (set as jest.Mock).mockResolvedValue(undefined);

        await Promise.all(values.map((value) => set(identifier, storeName, value, mode)));

        expect(set).toHaveBeenCalledTimes(3);
        values.forEach((value) => {
          expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        });

        log(`Successfully handled concurrent set operations in ${mode} mode`);
      });

      it(`should handle concurrent get operations in ${mode} mode`, async () => {
        const identifier = `concurrent-get-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (get as jest.Mock).mockResolvedValue({ value });

        const results = await Promise.all(
          Array(3)
            .fill(null)
            .map(() => get(identifier, storeName, mode)),
        );

        expect(get).toHaveBeenCalledTimes(3);
        results.forEach((result) => {
          expect(result.value).toEqual(value);
        });

        log(`Successfully handled concurrent get operations in ${mode} mode`);
      });

      it(`should handle concurrent set and get operations in ${mode} mode`, async () => {
        const identifier = `concurrent-set-get-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value });

        await Promise.all([
          set(identifier, storeName, value, mode),
          get(identifier, storeName, mode),
        ]);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        expect(get).toHaveBeenCalledWith(identifier, storeName, mode);

        log(`Successfully handled concurrent set and get operations in ${mode} mode`);
      });

      it(`should handle concurrent set and remove operations in ${mode} mode`, async () => {
        const identifier = `concurrent-set-remove-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (remove as jest.Mock).mockResolvedValue(undefined);

        await Promise.all([
          set(identifier, storeName, value, mode),
          remove(identifier, storeName, mode),
        ]);

        expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);

        log(`Successfully handled concurrent set and remove operations in ${mode} mode`);
      });

      it(`should handle rapid successive updates in ${mode} mode`, async () => {
        const identifier = `rapid-updates-${mode}`;
        const values: StringValue[] = Array(10)
          .fill(null)
          .map((_, i) => ({ type: 'string', value: `value${i}` }));

        (set as jest.Mock).mockResolvedValue(undefined);

        await values.reduce((promise, value) => {
          return promise.then(() => set(identifier, storeName, value, mode));
        }, Promise.resolve());

        expect(set).toHaveBeenCalledTimes(10);
        values.forEach((value) => {
          expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
        });

        log(`Successfully handled rapid successive updates in ${mode} mode`);
      });
    });
  });

  it('should maintain data consistency across concurrent operations in different modes', async () => {
    const identifier = 'cross-mode-concurrency';
    const value: StringValue = { type: 'string', value: 'consistent value' };

    (set as jest.Mock).mockResolvedValue(undefined);
    (get as jest.Mock).mockResolvedValue({ value });

    await Promise.all(modes.map((mode) => set(identifier, storeName, value, mode)));

    const results = await Promise.all(modes.map((mode) => get(identifier, storeName, mode)));

    expect(set).toHaveBeenCalledTimes(modes.length);
    expect(get).toHaveBeenCalledTimes(modes.length);
    results.forEach((result) => {
      expect(result.value).toEqual(value);
    });

    log('Successfully maintained data consistency across concurrent operations in different modes');
  });
});
