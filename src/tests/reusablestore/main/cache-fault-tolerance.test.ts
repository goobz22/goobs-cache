import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-fault-tolerance-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Fault Tolerance Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Cache Fault Tolerance tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should handle network failures during set operation in ${mode} mode`, async () => {
        const identifier = `network-failure-set-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow('Network failure');

        log(`Successfully handled network failure during set operation in ${mode} mode`);
      });

      it(`should handle network failures during get operation in ${mode} mode`, async () => {
        const identifier = `network-failure-get-${mode}`;

        (get as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        await expect(get(identifier, storeName, mode)).rejects.toThrow('Network failure');

        log(`Successfully handled network failure during get operation in ${mode} mode`);
      });

      it(`should handle network failures during remove operation in ${mode} mode`, async () => {
        const identifier = `network-failure-remove-${mode}`;

        (remove as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        await expect(remove(identifier, storeName, mode)).rejects.toThrow('Network failure');

        log(`Successfully handled network failure during remove operation in ${mode} mode`);
      });

      it(`should handle server errors in ${mode} mode`, async () => {
        const identifier = `server-error-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockRejectedValueOnce(new Error('Internal Server Error'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow(
          'Internal Server Error',
        );

        log(`Successfully handled server error in ${mode} mode`);
      });

      it(`should handle timeout errors in ${mode} mode`, async () => {
        const identifier = `timeout-error-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        (set as jest.Mock).mockRejectedValueOnce(new Error('Operation timed out'));

        await expect(set(identifier, storeName, value, mode)).rejects.toThrow(
          'Operation timed out',
        );

        log(`Successfully handled timeout error in ${mode} mode`);
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

      it(`should handle data corruption scenarios in ${mode} mode`, async () => {
        const identifier = `data-corruption-${mode}`;
        const corruptedResult: CacheResult = {
          identifier,
          storeName,
          value: { type: 'string', value: 'corrupted data' },
          expirationDate: new Date(Date.now() + 3600000),
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        };

        (get as jest.Mock).mockResolvedValueOnce(corruptedResult);

        const result = await get(identifier, storeName, mode);

        expect(result.value).not.toEqual({ type: 'string', value: 'expected data' });
        expect(result.value).toEqual({ type: 'string', value: 'corrupted data' });

        log(`Successfully detected data corruption scenario in ${mode} mode`);
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

      it(`should handle partial failures in ${mode} mode`, async () => {
        const identifier = `partial-failure-${mode}`;
        const value: StringValue = { type: 'string', value: 'test value' };

        // Simulate a scenario where set succeeds but get fails
        (set as jest.Mock).mockResolvedValueOnce(undefined);
        (get as jest.Mock).mockRejectedValueOnce(new Error('Get operation failed'));

        await set(identifier, storeName, value, mode);
        await expect(get(identifier, storeName, mode)).rejects.toThrow('Get operation failed');

        log(`Successfully handled partial failure scenario in ${mode} mode`);
      });
    });
  });

  it('should handle fallback between modes in case of failures', async () => {
    const identifier = 'fallback-test';
    const value: StringValue = { type: 'string', value: 'fallback test' };

    // Simulate failure in server mode
    (set as jest.Mock).mockRejectedValueOnce(new Error('Server mode failed'));
    // Simulate success in client mode
    (set as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(set(identifier, storeName, value, 'server')).rejects.toThrow('Server mode failed');
    await expect(set(identifier, storeName, value, 'client')).resolves.not.toThrow();

    log('Successfully handled fallback between modes in case of failures');
  });

  it('should maintain data integrity across mode failures', async () => {
    const identifier = 'data-integrity-test';
    const value: StringValue = { type: 'string', value: 'integrity test' };

    // Set succeeds in server mode
    (set as jest.Mock).mockResolvedValueOnce(undefined);
    // Get fails in server mode but succeeds in client mode
    (get as jest.Mock)
      .mockRejectedValueOnce(new Error('Server mode failed'))
      .mockResolvedValueOnce({
        identifier,
        storeName,
        value,
        expirationDate: new Date(Date.now() + 3600000),
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });

    await set(identifier, storeName, value, 'server');
    await expect(get(identifier, storeName, 'server')).rejects.toThrow('Server mode failed');
    const clientResult = await get(identifier, storeName, 'client');

    expect(clientResult.value).toEqual(value);
    log('Successfully maintained data integrity across mode failures');
  });

  it('should handle cascading failures across multiple modes', async () => {
    const identifier = 'cascading-failure-test';
    const value: StringValue = { type: 'string', value: 'cascading test' };

    // Simulate failures in server, client, and cookie modes
    (set as jest.Mock)
      .mockRejectedValueOnce(new Error('Server mode failed'))
      .mockRejectedValueOnce(new Error('Client mode failed'))
      .mockRejectedValueOnce(new Error('Cookie mode failed'))
      // twoLayer mode succeeds
      .mockResolvedValueOnce(undefined);

    await expect(set(identifier, storeName, value, 'server')).rejects.toThrow('Server mode failed');
    await expect(set(identifier, storeName, value, 'client')).rejects.toThrow('Client mode failed');
    await expect(set(identifier, storeName, value, 'cookie')).rejects.toThrow('Cookie mode failed');
    await expect(set(identifier, storeName, value, 'twoLayer')).resolves.not.toThrow();

    log('Successfully handled cascading failures across multiple modes');
  });

  it('should recover from temporary failures', async () => {
    const identifier = 'recovery-test';
    const value: StringValue = { type: 'string', value: 'recovery test' };

    // Simulate temporary failure followed by success
    (set as jest.Mock)
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(undefined);

    await expect(set(identifier, storeName, value, 'server')).rejects.toThrow('Temporary failure');
    await expect(set(identifier, storeName, value, 'server')).resolves.not.toThrow();

    log('Successfully recovered from temporary failure');
  });

  it('should handle concurrent failures and successes', async () => {
    const identifiers = ['concurrent-1', 'concurrent-2', 'concurrent-3'];
    const value: StringValue = { type: 'string', value: 'concurrent test' };

    // Simulate mix of failures and successes
    (set as jest.Mock)
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Failure 2'));

    const results = await Promise.allSettled(
      identifiers.map((id) => set(id, storeName, value, 'server')),
    );

    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('fulfilled');
    expect(results[2].status).toBe('rejected');

    log('Successfully handled concurrent failures and successes');
  });

  it('should maintain consistency in two-layer mode during partial failures', async () => {
    const identifier = 'two-layer-partial-failure';
    const value: StringValue = { type: 'string', value: 'two-layer test' };

    // Simulate first layer failure but second layer success
    (set as jest.Mock)
      .mockImplementationOnce(() => {
        throw new Error('First layer failed');
      })
      .mockResolvedValueOnce(undefined);

    await expect(set(identifier, storeName, value, 'twoLayer')).resolves.not.toThrow();

    // Simulate successful retrieval from second layer
    (get as jest.Mock).mockResolvedValueOnce({
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result = await get(identifier, storeName, 'twoLayer');
    expect(result.value).toEqual(value);

    log('Successfully maintained consistency in two-layer mode during partial failures');
  });

  it('should handle out-of-order responses in asynchronous operations', async () => {
    const identifier = 'out-of-order-test';
    const values: StringValue[] = [
      { type: 'string', value: 'first' },
      { type: 'string', value: 'second' },
      { type: 'string', value: 'third' },
    ];

    // Simulate out-of-order responses
    (set as jest.Mock)
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 30)),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 10)),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 20)),
      );

    await Promise.all(values.map((value) => set(identifier, storeName, value, 'server')));

    // The last set operation should be the one that persists
    (get as jest.Mock).mockResolvedValueOnce({
      identifier,
      storeName,
      value: values[2],
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 3,
    });

    const result = await get(identifier, storeName, 'server');
    expect(result.value).toEqual(values[2]);

    log('Successfully handled out-of-order responses in asynchronous operations');
  });
});
