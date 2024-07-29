import { compressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('consistent-compression-results.log');
const log = createLogger(logStream);

describe('Consistent Compression Results for Same Input', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should produce consistent results for small string input', async () => {
    const input = 'Hello, World!';
    log('Testing consistency for small string input');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for small string input');
  });

  it('should produce consistent results for large string input', async () => {
    const input = 'a'.repeat(1000000);
    log('Testing consistency for large string input');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for large string input');
  });

  it('should produce consistent results for input with special characters', async () => {
    const input = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    log('Testing consistency for input with special characters');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for input with special characters');
  });

  it('should produce consistent results for input with unicode characters', async () => {
    const input = '你好世界こんにちは세계안녕하세요';
    log('Testing consistency for input with unicode characters');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for input with unicode characters');
  });

  it('should produce consistent results for repeated pattern input', async () => {
    const input = 'abcdefg'.repeat(10000);
    log('Testing consistency for repeated pattern input');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for repeated pattern input');
  });

  it('should produce consistent results for JSON string input', async () => {
    const input = JSON.stringify({
      name: 'John Doe',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown',
        country: 'USA',
      },
      hobbies: ['reading', 'cycling', 'photography'],
    });
    log('Testing consistency for JSON string input');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for JSON string input');
  });

  it('should produce consistent results for input with long runs of the same character', async () => {
    const input = 'a'.repeat(10000) + 'b'.repeat(10000) + 'c'.repeat(10000);
    log('Testing consistency for input with long runs of the same character');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for input with long runs of the same character');
  });

  it('should produce consistent results for input with alternating patterns', async () => {
    const input = ('abc123'.repeat(1000) + 'xyz789'.repeat(1000)).repeat(10);
    log('Testing consistency for input with alternating patterns');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for input with alternating patterns');
  });

  it('should produce consistent results for input with whitespace', async () => {
    const input = '    \t\n\r'.repeat(10000);
    log('Testing consistency for input with whitespace');

    const results: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      const compressed = await compressData(input);
      results.push(compressed);
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
    log('Compression results consistent for input with whitespace');
  });
});
