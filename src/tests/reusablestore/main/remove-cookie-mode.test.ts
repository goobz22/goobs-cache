import { remove, set } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  remove: jest.fn(),
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('remove-cookie-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Remove Cookie Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'cookie';

  beforeAll(() => {
    log('Starting Remove Cookie Mode tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a value in cookie mode', async () => {
    const identifier = 'remove-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value in cookie mode');
  });

  it('should handle removing a non-existent value', async () => {
    const identifier = 'non-existent-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully handled removing a non-existent value in cookie mode');
  });

  it('should remove a value after setting it', async () => {
    const identifier = 'set-then-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await set(identifier, storeName, value, mode);
    await remove(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value after setting it in cookie mode');
  });

  it('should handle errors when removing a value', async () => {
    const identifier = 'error-test';

    (remove as jest.Mock).mockRejectedValueOnce(new Error('Failed to remove value from cookie'));

    await expect(remove(identifier, storeName, mode)).rejects.toThrow(
      'Failed to remove value from cookie',
    );

    log('Successfully handled errors when removing a value in cookie mode');
  });

  it('should remove multiple values in quick succession', async () => {
    const identifiers = ['multi-1', 'multi-2', 'multi-3'];

    await Promise.all(identifiers.map((id) => remove(id, storeName, mode)));

    expect(remove).toHaveBeenCalledTimes(3);
    identifiers.forEach((id) => {
      expect(remove).toHaveBeenCalledWith(id, storeName, mode);
    });

    log('Successfully removed multiple values in quick succession in cookie mode');
  });

  it('should not affect other stores when removing a value', async () => {
    const identifier = 'store-isolation-test';
    const otherStoreName = 'other-store';

    await remove(identifier, storeName, mode);
    await remove(identifier, otherStoreName, mode);

    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(remove).toHaveBeenCalledWith(identifier, otherStoreName, mode);
    log('Successfully demonstrated store isolation when removing values in cookie mode');
  });

  it('should handle removing a value with a long identifier', async () => {
    const longIdentifier = 'a'.repeat(100); // Cookies typically have size limitations

    await remove(longIdentifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(longIdentifier, storeName, mode);
    log('Successfully removed a value with a long identifier in cookie mode');
  });

  it('should handle removing a value immediately after setting it', async () => {
    const identifier = 'immediate-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await set(identifier, storeName, value, mode);
    await remove(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value immediately after setting it in cookie mode');
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
    log('Successfully handled concurrent set and remove operations in cookie mode');
  });

  it('should handle removing values with special characters in the identifier', async () => {
    const identifier = 'special!@#$%^&*()_+-=[]{}|;:,.<>?';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value with special characters in the identifier in cookie mode');
  });
});
