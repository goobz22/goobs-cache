import { subscribeToUpdates } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  subscribeToUpdates: jest.requireActual('../../../ReusableStore').subscribeToUpdates,
}));

const logStream: WriteStream = createLogStream('subscribe-to-updates-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Subscribe to Updates with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const identifier = 'test-identifier';
  const listener = jest.fn();

  beforeAll(() => {
    log('Starting Subscribe to Updates with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when mode is an empty string', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, '' as CacheMode),
    ).rejects.toThrow('Invalid cache mode: ');

    log('Successfully rejected subscribe operation with empty string mode');
  });

  it('should throw an error when mode is undefined', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, undefined as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode: undefined');

    log('Successfully rejected subscribe operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, null as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode: null');

    log('Successfully rejected subscribe operation with null mode');
  });

  it('should throw an error when mode is a number', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, 123 as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode: 123');

    log('Successfully rejected subscribe operation with number mode');
  });

  it('should throw an error when mode is a boolean', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, true as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode: true');

    log('Successfully rejected subscribe operation with boolean mode');
  });

  it('should throw an error when mode is an object', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, {} as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode: [object Object]');

    log('Successfully rejected subscribe operation with object mode');
  });

  it('should throw an error when mode is an invalid string', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, 'invalidMode' as CacheMode),
    ).rejects.toThrow('Invalid cache mode: invalidMode');

    log('Successfully rejected subscribe operation with invalid string mode');
  });

  it('should not throw an error for valid cache modes', async () => {
    const validModes: CacheMode[] = ['server', 'client', 'twoLayer'];

    for (const mode of validModes) {
      await expect(
        subscribeToUpdates(identifier, storeName, listener, mode),
      ).resolves.not.toThrow();
    }

    log('Successfully accepted subscribe operations with valid cache modes');
  });

  it('should throw an error when mode is cookie', async () => {
    await expect(
      subscribeToUpdates(identifier, storeName, listener, 'cookie' as CacheMode),
    ).rejects.toThrow('Subscribe to updates is not supported in cookie mode');

    log('Successfully rejected subscribe operation with cookie mode');
  });

  it('should handle errors when listener is not a function', async () => {
    const invalidListener = 'not a function' as unknown as (data: unknown) => void;

    await expect(
      subscribeToUpdates(identifier, storeName, invalidListener, 'server'),
    ).rejects.toThrow('Listener must be a function');

    log('Successfully rejected subscribe operation with invalid listener');
  });
});
