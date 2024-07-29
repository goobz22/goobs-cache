import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - initialization', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('initializationTests.log');
  const log = createLogger(logStream);

  beforeAll(() => {
    config = { ...mockCacheConfig };
    setMockedGlobals();
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    cache = new TwoLayerCache(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with the provided configuration', () => {
    log('Testing initialization with provided configuration');
    expect(cache['config']).toEqual(config);
  });

  it('should initialize with a TwoLayerServerCache instance', () => {
    log('Testing initialization with TwoLayerServerCache instance');
    expect(cache['serverCache']).toBeInstanceOf(Object);
    expect(cache['serverCache'].constructor.name).toBe('TwoLayerServerCache');
  });

  it('should initialize with a TwoLayerClientCache instance in a client-side environment', () => {
    log('Testing initialization with TwoLayerClientCache instance in client-side environment');
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    cache = new TwoLayerCache(config);

    expect(cache['clientCache']).toBeInstanceOf(Object);
    expect(cache['clientCache']?.constructor.name).toBe('TwoLayerClientCache');
  });

  it('should initialize without a TwoLayerClientCache instance in a server-side environment', () => {
    log('Testing initialization without TwoLayerClientCache instance in server-side environment');
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    cache = new TwoLayerCache(config);

    expect(cache['clientCache']).toBeNull();
  });

  it('should initialize with an empty listeners map', () => {
    log('Testing initialization with empty listeners map');
    expect(cache['listeners']).toBeInstanceOf(Map);
    expect(cache['listeners'].size).toBe(0);
  });

  it('should set the isClient flag based on the environment', () => {
    log('Testing isClient flag based on environment');
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    cache = new TwoLayerCache(config);
    expect(cache['isClient']).toBe(true);

    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    cache = new TwoLayerCache(config);
    expect(cache['isClient']).toBe(false);
  });
});
