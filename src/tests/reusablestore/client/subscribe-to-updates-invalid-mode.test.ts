import { subscribeToUpdates } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('subscribe-to-updates-invalid-mode-test.log');
const log = createLogger(logStream);

describe('Subscribe to Updates Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const identifier = 'test-identifier';

  beforeAll(() => {
    log('Starting Subscribe to Updates Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testInvalidMode = (mode: CacheMode) => {
    it(`should throw an error when using '${mode}' mode`, () => {
      const mockListener = jest.fn();

      expect(() => {
        subscribeToUpdates(identifier, storeName, mockListener);
      }).toThrow(`Invalid cache mode for subscribeToUpdates: ${mode}`);

      expect(mockListener).not.toHaveBeenCalled();

      log(`Successfully handled invalid '${mode}' mode in subscribeToUpdates`);
    });
  };

  testInvalidMode('cookie');
  testInvalidMode('server');
  testInvalidMode('twoLayer');

  it('should throw an error when using an undefined mode', () => {
    const mockListener = jest.fn();

    expect(() => {
      subscribeToUpdates(identifier, storeName, mockListener);
    }).toThrow('Invalid cache mode for subscribeToUpdates: undefined');

    expect(mockListener).not.toHaveBeenCalled();

    log('Successfully handled undefined mode in subscribeToUpdates');
  });

  it('should throw an error when using a null mode', () => {
    const mockListener = jest.fn();

    expect(() => {
      subscribeToUpdates(identifier, storeName, mockListener);
    }).toThrow('Invalid cache mode for subscribeToUpdates: null');

    expect(mockListener).not.toHaveBeenCalled();

    log('Successfully handled null mode in subscribeToUpdates');
  });

  it('should throw an error when using an invalid mode string', () => {
    const mockListener = jest.fn();
    const invalidMode = 'invalid' as CacheMode;

    expect(() => {
      subscribeToUpdates(identifier, storeName, mockListener);
    }).toThrow(`Invalid cache mode for subscribeToUpdates: ${invalidMode}`);

    expect(mockListener).not.toHaveBeenCalled();

    log('Successfully handled invalid mode string in subscribeToUpdates');
  });

  it('should not throw an error when using client mode', () => {
    const mockListener = jest.fn();
    const clientMode: CacheMode = 'client';
    const identifier = 'test-identifier';
    const storeName = 'test-store';

    // Use a type assertion to set the global cacheMode
    (globalThis as { cacheMode?: CacheMode }).cacheMode = clientMode;

    expect(() => {
      subscribeToUpdates<StringValue>(identifier, storeName, mockListener);
    }).not.toThrow();

    // Reset the global cacheMode after the test
    (globalThis as { cacheMode?: CacheMode }).cacheMode = undefined;

    log('Successfully handled valid client mode in subscribeToUpdates');
  });

  it('should handle errors in the listener function', () => {
    const errorListener = () => {
      throw new Error('Listener error');
    };

    const unsubscribe = subscribeToUpdates<StringValue>(identifier, storeName, errorListener);

    expect(() => {
      // Simulate an update
      unsubscribe();
    }).not.toThrow();

    log('Successfully handled errors in the listener function');
  });
});
