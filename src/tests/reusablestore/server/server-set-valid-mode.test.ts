import { serverSet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
}));

const logStream: WriteStream = createLogStream('server-set-valid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Set with Valid Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-side Set with Valid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully set a value with valid mode', async () => {
    const identifier = 'valid-set-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    (serverSet as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier, storeName, value, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);

    log('Successfully set a value with valid mode');
  });

  it('should handle errors when setting a value', async () => {
    const identifier = 'error-set-test';
    const value: StringValue = { type: 'string', value: 'error test value' };
    const expirationDate = new Date(Date.now() + 3600000);
    const errorMessage = 'Failed to set value';

    (serverSet as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverSet(identifier, storeName, value, expirationDate, mode)).rejects.toThrow(
      errorMessage,
    );

    log('Successfully handled error when setting a value');
  });

  it('should set values with different types', async () => {
    const identifier = 'multi-type-set-test';
    const stringValue: StringValue = { type: 'string', value: 'string value' };
    const numberValue = 42;
    const booleanValue = true;
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier + '-string', storeName, stringValue, expirationDate, mode);
    await serverSet(identifier + '-number', storeName, numberValue, expirationDate, mode);
    await serverSet(identifier + '-boolean', storeName, booleanValue, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledTimes(3);
    expect(serverSet).toHaveBeenCalledWith(
      identifier + '-string',
      storeName,
      stringValue,
      expirationDate,
      mode,
    );
    expect(serverSet).toHaveBeenCalledWith(
      identifier + '-number',
      storeName,
      numberValue,
      expirationDate,
      mode,
    );
    expect(serverSet).toHaveBeenCalledWith(
      identifier + '-boolean',
      storeName,
      booleanValue,
      expirationDate,
      mode,
    );

    log('Successfully set values with different types');
  });

  it('should handle setting the same key multiple times', async () => {
    const identifier = 'multiple-set-test';
    const value1: StringValue = { type: 'string', value: 'first value' };
    const value2: StringValue = { type: 'string', value: 'second value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier, storeName, value1, expirationDate, mode);
    await serverSet(identifier, storeName, value2, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledTimes(2);
    expect(serverSet).toHaveBeenLastCalledWith(identifier, storeName, value2, expirationDate, mode);

    log('Successfully handled setting the same key multiple times');
  });

  it('should handle setting values with different expiration dates', async () => {
    const identifier = 'expiration-test';
    const value: StringValue = { type: 'string', value: 'expiration test' };
    const shortExpirationDate = new Date(Date.now() + 1000); // 1 second from now
    const longExpirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    (serverSet as jest.Mock).mockResolvedValue(undefined);

    await serverSet(identifier + '-short', storeName, value, shortExpirationDate, mode);
    await serverSet(identifier + '-long', storeName, value, longExpirationDate, mode);

    expect(serverSet).toHaveBeenCalledTimes(2);
    expect(serverSet).toHaveBeenCalledWith(
      identifier + '-short',
      storeName,
      value,
      shortExpirationDate,
      mode,
    );
    expect(serverSet).toHaveBeenCalledWith(
      identifier + '-long',
      storeName,
      value,
      longExpirationDate,
      mode,
    );

    log('Successfully handled setting values with different expiration dates');
  });
});
