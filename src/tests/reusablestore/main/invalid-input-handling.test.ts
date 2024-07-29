import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, DataValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('invalid-input-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Invalid Input Handling Tests', () => {
  const validStoreName = 'test-store';
  const validIdentifier = 'test-identifier';
  const validMode: CacheMode = 'server';
  const validValue: StringValue = { type: 'string', value: 'test value' };

  beforeAll(() => {
    log('Starting Invalid Input Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set function', () => {
    it('should throw an error for empty identifier', async () => {
      await expect(set('', validStoreName, validValue, validMode)).rejects.toThrow(
        'Invalid identifier',
      );
      log('Successfully handled empty identifier in set function');
    });

    it('should throw an error for empty store name', async () => {
      await expect(set(validIdentifier, '', validValue, validMode)).rejects.toThrow(
        'Invalid store name',
      );
      log('Successfully handled empty store name in set function');
    });

    it('should throw an error for invalid mode', async () => {
      await expect(
        set(validIdentifier, validStoreName, validValue, 'invalid' as CacheMode),
      ).rejects.toThrow('Invalid cache mode');
      log('Successfully handled invalid mode in set function');
    });
  });

  describe('get function', () => {
    it('should throw an error for empty identifier', async () => {
      await expect(get('', validStoreName, validMode)).rejects.toThrow('Invalid identifier');
      log('Successfully handled empty identifier in get function');
    });

    it('should throw an error for empty store name', async () => {
      await expect(get(validIdentifier, '', validMode)).rejects.toThrow('Invalid store name');
      log('Successfully handled empty store name in get function');
    });

    it('should throw an error for invalid mode', async () => {
      await expect(get(validIdentifier, validStoreName, 'invalid' as CacheMode)).rejects.toThrow(
        'Invalid cache mode',
      );
      log('Successfully handled invalid mode in get function');
    });
  });

  describe('remove function', () => {
    it('should throw an error for empty identifier', async () => {
      await expect(remove('', validStoreName, validMode)).rejects.toThrow('Invalid identifier');
      log('Successfully handled empty identifier in remove function');
    });

    it('should throw an error for empty store name', async () => {
      await expect(remove(validIdentifier, '', validMode)).rejects.toThrow('Invalid store name');
      log('Successfully handled empty store name in remove function');
    });

    it('should throw an error for invalid mode', async () => {
      await expect(remove(validIdentifier, validStoreName, 'invalid' as CacheMode)).rejects.toThrow(
        'Invalid cache mode',
      );
      log('Successfully handled invalid mode in remove function');
    });
  });

  describe('subscribeToUpdates function', () => {
    const validListener = jest.fn();

    it('should throw an error for empty identifier', async () => {
      await expect(
        subscribeToUpdates('', validStoreName, validListener, validMode),
      ).rejects.toThrow('Invalid identifier');
      log('Successfully handled empty identifier in subscribeToUpdates function');
    });

    it('should throw an error for empty store name', async () => {
      await expect(
        subscribeToUpdates(validIdentifier, '', validListener, validMode),
      ).rejects.toThrow('Invalid store name');
      log('Successfully handled empty store name in subscribeToUpdates function');
    });

    it('should throw an error for invalid mode', async () => {
      await expect(
        subscribeToUpdates(validIdentifier, validStoreName, validListener, 'invalid' as CacheMode),
      ).rejects.toThrow('Invalid cache mode');
      log('Successfully handled invalid mode in subscribeToUpdates function');
    });

    it('should throw an error for invalid listener', async () => {
      const invalidListener: (data: DataValue | undefined) => void =
        'not a function' as unknown as (data: DataValue | undefined) => void;
      await expect(
        subscribeToUpdates(validIdentifier, validStoreName, invalidListener, validMode),
      ).rejects.toThrow('Invalid listener');
      log('Successfully handled invalid listener in subscribeToUpdates function');
    });
  });
});
