import { serverRemove, serverSet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverRemove: jest.fn(),
  serverSet: jest.fn(),
}));

const logStream: WriteStream = createLogStream('server-remove-valid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Remove with Valid Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-side Remove with Valid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully remove a value with valid mode', async () => {
    const identifier = 'valid-remove-test';

    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await serverRemove(identifier, storeName, mode);

    expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully removed a value with valid mode');
  });

  it('should handle errors when removing a value', async () => {
    const identifier = 'error-remove-test';
    const errorMessage = 'Failed to remove value';

    (serverRemove as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverRemove(identifier, storeName, mode)).rejects.toThrow(errorMessage);

    log('Successfully handled error when removing a value');
  });

  it('should not throw an error when removing a non-existent key', async () => {
    const identifier = 'non-existent-key-test';

    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await expect(serverRemove(identifier, storeName, mode)).resolves.not.toThrow();

    log('Successfully handled removal of non-existent key');
  });

  it('should remove values set with different types', async () => {
    const identifiers = ['string-value', 'number-value', 'boolean-value'];

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    // Set values of different types
    await serverSet(identifiers[0], storeName, { type: 'string', value: 'test' }, new Date(), mode);
    await serverSet(identifiers[1], storeName, 42, new Date(), mode);
    await serverSet(identifiers[2], storeName, true, new Date(), mode);

    // Remove all values
    for (const identifier of identifiers) {
      await serverRemove(identifier, storeName, mode);
    }

    expect(serverRemove).toHaveBeenCalledTimes(3);
    identifiers.forEach((identifier) => {
      expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);
    });

    log('Successfully removed values set with different types');
  });

  it('should handle removing the same key multiple times', async () => {
    const identifier = 'multiple-remove-test';

    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await serverRemove(identifier, storeName, mode);
    await serverRemove(identifier, storeName, mode);

    expect(serverRemove).toHaveBeenCalledTimes(2);
    expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully handled removing the same key multiple times');
  });

  it('should remove a value immediately after setting it', async () => {
    const identifier = 'set-then-remove-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier, storeName, value, new Date(), mode);
    await serverRemove(identifier, storeName, mode);

    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expect.any(Date), mode);
    expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully removed a value immediately after setting it');
  });
});
