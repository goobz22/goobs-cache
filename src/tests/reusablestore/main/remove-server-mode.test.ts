import { remove, set } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  remove: jest.fn(),
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('remove-server-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Remove Server Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Remove Server Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a value in server mode', async () => {
    const identifier = 'remove-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value in server mode');
  });

  it('should handle removing a non-existent value', async () => {
    const identifier = 'non-existent-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully handled removing a non-existent value in server mode');
  });

  it('should remove a value after setting it', async () => {
    const identifier = 'set-then-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await set(identifier, storeName, value, mode);
    await remove(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value after setting it in server mode');
  });

  it('should handle errors when removing a value', async () => {
    const identifier = 'error-test';

    (remove as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to remove value from server cache'),
    );

    await expect(remove(identifier, storeName, mode)).rejects.toThrow(
      'Failed to remove value from server cache',
    );

    log('Successfully handled errors when removing a value in server mode');
  });

  it('should remove multiple values in quick succession', async () => {
    const identifiers = ['multi-1', 'multi-2', 'multi-3'];

    await Promise.all(identifiers.map((id) => remove(id, storeName, mode)));

    expect(remove).toHaveBeenCalledTimes(3);
    identifiers.forEach((id) => {
      expect(remove).toHaveBeenCalledWith(id, storeName, mode);
    });

    log('Successfully removed multiple values in quick succession in server mode');
  });

  it('should not affect other stores when removing a value', async () => {
    const identifier = 'store-isolation-test';
    const otherStoreName = 'other-store';

    await remove(identifier, storeName, mode);
    await remove(identifier, otherStoreName, mode);

    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(remove).toHaveBeenCalledWith(identifier, otherStoreName, mode);
    log('Successfully demonstrated store isolation when removing values in server mode');
  });

  it('should handle removing a value with a long identifier', async () => {
    const longIdentifier = 'a'.repeat(1000);

    await remove(longIdentifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(longIdentifier, storeName, mode);
    log('Successfully removed a value with a long identifier in server mode');
  });

  it('should handle removing a value immediately after setting it', async () => {
    const identifier = 'immediate-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await set(identifier, storeName, value, mode);
    await remove(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value immediately after setting it in server mode');
  });

  it('should handle concurrent set and remove operations', async () => {
    const identifier = 'concurrent-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await Promise.all([
      set(identifier, storeName, value, mode),
      remove(identifier, storeName, mode),
    ]);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully handled concurrent set and remove operations in server mode');
  });
});
