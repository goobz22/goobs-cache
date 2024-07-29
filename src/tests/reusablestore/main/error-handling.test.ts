import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('error-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Error Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Error Handling tests...');
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
      it(`should handle network errors during set operation in ${mode} mode`, async () => {
        const identifier = `network-error-set-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow('Network error');

        log(`Successfully handled network error during set operation in ${mode} mode`);
      });

      it(`should handle network errors during get operation in ${mode} mode`, async () => {
        const identifier = `network-error-get-${mode}`;

        (get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(get(identifier, storeName, mode)).rejects.toThrow('Network error');

        log(`Successfully handled network error during get operation in ${mode} mode`);
      });

      it(`should handle network errors during remove operation in ${mode} mode`, async () => {
        const identifier = `network-error-remove-${mode}`;

        (remove as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(remove(identifier, storeName, mode)).rejects.toThrow('Network error');

        log(`Successfully handled network error during remove operation in ${mode} mode`);
      });

      it(`should handle storage quota exceeded errors in ${mode} mode`, async () => {
        const identifier = `quota-exceeded-${mode}`;
        const value: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024) }; // 1MB string

        (set as jest.Mock).mockRejectedValueOnce(new Error('Storage quota exceeded'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow(
          'Storage quota exceeded',
        );

        log(`Successfully handled storage quota exceeded error in ${mode} mode`);
      });

      it(`should handle invalid data errors during get operation in ${mode} mode`, async () => {
        const identifier = `invalid-data-${mode}`;

        (get as jest.Mock).mockRejectedValueOnce(new Error('Invalid data format'));

        await expect(get(identifier, storeName, mode)).rejects.toThrow('Invalid data format');

        log(`Successfully handled invalid data error during get operation in ${mode} mode`);
      });

      it(`should handle permission errors in ${mode} mode`, async () => {
        const identifier = `permission-error-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow('Permission denied');

        log(`Successfully handled permission error in ${mode} mode`);
      });

      if (mode !== 'cookie') {
        it(`should handle subscription errors in ${mode} mode`, async () => {
          const identifier = `subscription-error-${mode}`;
          const listener = jest.fn();

          (subscribeToUpdates as jest.Mock).mockRejectedValueOnce(new Error('Subscription failed'));

          await expect(subscribeToUpdates(identifier, storeName, listener, mode)).rejects.toThrow(
            'Subscription failed',
          );

          log(`Successfully handled subscription error in ${mode} mode`);
        });
      }
    });
  });

  it('should handle errors consistently across all modes', async () => {
    const identifier = 'cross-mode-error';
    const value: StringValue = { type: 'string', value: 'test value' };

    for (const testMode of modes) {
      (set as jest.Mock).mockRejectedValueOnce(new Error('Consistent error'));

      await expect(set(identifier, storeName, value, testMode)).rejects.toThrow('Consistent error');
    }

    log('Successfully handled errors consistently across all modes');
  });

  it('should handle unexpected error types', async () => {
    const identifier = 'unexpected-error';
    const value: StringValue = { type: 'string', value: 'test value' };

    (set as jest.Mock).mockRejectedValueOnce('Unexpected string error');

    await expect(set(identifier, storeName, value, 'server')).rejects.toEqual(
      'Unexpected string error',
    );

    log('Successfully handled unexpected error type');
  });

  it('should handle errors with additional properties', async () => {
    const identifier = 'error-with-properties';
    const value: StringValue = { type: 'string', value: 'test value' };

    const customError = new Error('Custom error');
    (customError as unknown as Record<string, unknown>).customProperty = 'test';

    (set as jest.Mock).mockRejectedValueOnce(customError);

    await expect(set(identifier, storeName, value, 'server')).rejects.toThrow('Custom error');

    log('Successfully handled error with additional properties');
  });
});
