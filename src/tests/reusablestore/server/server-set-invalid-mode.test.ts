import { serverSet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.requireActual('../../../ReusableStore.server').serverSet,
}));

const logStream: WriteStream = createLogStream('server-set-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Set with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const invalidModes: CacheMode[] = ['client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Server-side Set with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(invalidModes)('should throw an error when mode is %s', async (invalidMode) => {
    const identifier = 'invalid-mode-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    await expect(
      serverSet(identifier, storeName, value, expirationDate, invalidMode),
    ).rejects.toThrow(`Invalid cache mode for server-side caching: ${invalidMode}`);

    log(`Successfully rejected set operation with invalid mode: ${invalidMode}`);
  });

  it('should throw an error when mode is undefined', async () => {
    const identifier = 'undefined-mode-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(identifier, storeName, value, expirationDate, undefined as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: undefined');

    log('Successfully rejected set operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    const identifier = 'null-mode-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(identifier, storeName, value, expirationDate, null as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: null');

    log('Successfully rejected set operation with null mode');
  });

  it('should throw an error when mode is an empty string', async () => {
    const identifier = 'empty-string-mode-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(identifier, storeName, value, expirationDate, '' as CacheMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: ');

    log('Successfully rejected set operation with empty string mode');
  });

  it('should throw an error when mode is a non-CacheMode string', async () => {
    const identifier = 'invalid-string-mode-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(identifier, storeName, value, expirationDate, 'invalidMode' as CacheMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: invalidMode');

    log('Successfully rejected set operation with invalid string mode');
  });
});
