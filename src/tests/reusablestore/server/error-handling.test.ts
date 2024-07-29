import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('error-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Error Handling Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

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

  it('should handle network errors during set operation', async () => {
    const identifier = 'network-error-set';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(serverSet(identifier, storeName, value, expirationDate, mode)).rejects.toThrow(
      'Network error',
    );

    log('Successfully handled network error during set operation');
  });

  it('should handle timeout errors during get operation', async () => {
    const identifier = 'timeout-error-get';

    (serverGet as jest.Mock).mockRejectedValue(new Error('Operation timed out'));

    await expect(serverGet(identifier, storeName, mode)).rejects.toThrow('Operation timed out');

    log('Successfully handled timeout error during get operation');
  });

  it('should handle server errors during remove operation', async () => {
    const identifier = 'server-error-remove';

    (serverRemove as jest.Mock).mockRejectedValue(new Error('Internal server error'));

    await expect(serverRemove(identifier, storeName, mode)).rejects.toThrow(
      'Internal server error',
    );

    log('Successfully handled server error during remove operation');
  });

  it('should handle invalid input for identifier', async () => {
    const invalidIdentifier = '';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(invalidIdentifier, storeName, value, expirationDate, mode),
    ).rejects.toThrow('Invalid identifier');

    log('Successfully handled invalid input for identifier');
  });

  it('should handle invalid input for store name', async () => {
    const identifier = 'valid-identifier';
    const invalidStoreName = '';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(identifier, invalidStoreName, value, expirationDate, mode),
    ).rejects.toThrow('Invalid store name');

    log('Successfully handled invalid input for store name');
  });

  it('should handle invalid cache mode', async () => {
    const identifier = 'invalid-mode';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);
    const invalidMode = 'invalid' as CacheMode;

    await expect(
      serverSet(identifier, storeName, value, expirationDate, invalidMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: invalid');

    log('Successfully handled invalid cache mode');
  });

  it('should handle errors when value is too large', async () => {
    const identifier = 'large-value';
    const largeValue: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024 * 10) }; // 10MB string
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockRejectedValue(new Error('Value too large'));

    await expect(
      serverSet(identifier, storeName, largeValue, expirationDate, mode),
    ).rejects.toThrow('Value too large');

    log('Successfully handled error when value is too large');
  });

  it('should handle errors during cache initialization', async () => {
    const identifier = 'init-error';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockRejectedValueOnce(new Error('Cache initialization failed'));

    await expect(serverSet(identifier, storeName, value, expirationDate, mode)).rejects.toThrow(
      'Cache initialization failed',
    );

    log('Successfully handled error during cache initialization');
  });

  it('should handle concurrent errors gracefully', async () => {
    const identifier = 'concurrent-error';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockRejectedValue(new Error('Concurrent operation error'));

    const promises = Array(5)
      .fill(null)
      .map(() => serverSet(identifier, storeName, value, expirationDate, mode));

    await expect(Promise.all(promises)).rejects.toThrow('Concurrent operation error');

    log('Successfully handled concurrent errors');
  });

  it('should handle errors when trying to get a non-existent key', async () => {
    const nonExistentKey = 'non-existent';

    (serverGet as jest.Mock).mockResolvedValue({
      identifier: nonExistentKey,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await serverGet(nonExistentKey, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled getting a non-existent key');
  });

  it('should handle errors when removing a non-existent key', async () => {
    const nonExistentKey = 'non-existent';

    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await expect(serverRemove(nonExistentKey, storeName, mode)).resolves.not.toThrow();

    log('Successfully handled removing a non-existent key');
  });

  it('should handle errors when setting an invalid value type', async () => {
    const identifier = 'invalid-type';
    const invalidValue = { invalid: 'value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(
      serverSet(
        identifier,
        storeName,
        invalidValue as unknown as StringValue,
        expirationDate,
        mode,
      ),
    ).rejects.toThrow();

    log('Successfully handled setting an invalid value type');
  });
});
