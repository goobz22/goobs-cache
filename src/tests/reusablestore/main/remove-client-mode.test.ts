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

const logStream: WriteStream = createLogStream('remove-client-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Remove Client Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';

  beforeAll(() => {
    log('Starting Remove Client Mode tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a value in client mode', async () => {
    const identifier = 'remove-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value in client mode');
  });

  it('should handle removing a non-existent value', async () => {
    const identifier = 'non-existent-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully handled removing a non-existent value in client mode');
  });

  it('should remove a value after setting it', async () => {
    const identifier = 'set-then-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    await set(identifier, storeName, value, mode);
    await remove(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value after setting it in client mode');
  });

  it('should handle errors when removing a value', async () => {
    const identifier = 'error-test';

    (remove as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to remove value from client storage'),
    );

    await expect(remove(identifier, storeName, mode)).rejects.toThrow(
      'Failed to remove value from client storage',
    );

    log('Successfully handled errors when removing a value in client mode');
  });

  it('should remove multiple values in quick succession', async () => {
    const identifiers = ['multi-1', 'multi-2', 'multi-3'];

    await Promise.all(identifiers.map((id) => remove(id, storeName, mode)));

    expect(remove).toHaveBeenCalledTimes(3);
    identifiers.forEach((id) => {
      expect(remove).toHaveBeenCalledWith(id, storeName, mode);
    });

    log('Successfully removed multiple values in quick succession in client mode');
  });

  it('should not affect other stores when removing a value', async () => {
    const identifier = 'store-isolation-test';
    const otherStoreName = 'other-store';

    await remove(identifier, storeName, mode);
    await remove(identifier, otherStoreName, mode);

    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(remove).toHaveBeenCalledWith(identifier, otherStoreName, mode);
    log('Successfully demonstrated store isolation when removing values in client mode');
  });
});
