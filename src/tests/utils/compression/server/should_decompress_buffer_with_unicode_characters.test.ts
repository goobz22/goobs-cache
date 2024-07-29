import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-buffer-with-unicode-characters.log');
const log = createLogger(logStream);

describe('Decompression of Buffer with Unicode Characters', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a buffer with Basic Multilingual Plane (BMP) characters', async () => {
    const bmpString = 'Hello, 世界! Здравствуй, мир! こんにちは、世界！';
    log('Testing decompression of buffer with BMP characters');

    log('Compressing BMP string');
    const compressed = await compressData(bmpString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(bmpString);
    log('Decompression of buffer with BMP characters successful');
  });

  it('should handle decompression of a buffer with Supplementary Multilingual Plane (SMP) characters', async () => {
    const smpString =
      '𠜎𠜱𠝹𠱓𠱸𠲖𠳏𠳕𠴕𠵼𠵿𠸎𠸏𠹷𠺝𠺢𠻗𠻹𠻺𠼭𠼮𠽌𠾴𠾼𠿪𡁜𡁯𡁵𡁶𡁻𡃁𡃉𡇙𢃇𢞵𢫕𢭃𢯊𢱑𢱕𢳂𢴈𢵌𢵧𢺳𣲷𤓓𤶸𤷪𥄫𦉘𦟌𦧲𦧺𧨾𨅝𨈇𨋢𨳊𨳍𨳒𩶘';
    log('Testing decompression of buffer with SMP characters');

    log('Compressing SMP string');
    const compressed = await compressData(smpString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(smpString);
    log('Decompression of buffer with SMP characters successful');
  });

  it('should decompress a buffer with Emoji characters', async () => {
    const emojiString =
      '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯';
    log('Testing decompression of buffer with Emoji characters');

    log('Compressing Emoji string');
    const compressed = await compressData(emojiString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(emojiString);
    log('Decompression of buffer with Emoji characters successful');
  });

  it('should handle decompression of a buffer with combining diacritical marks', async () => {
    const combiningMarksString = 'a\u0301e\u0301i\u0301o\u0301u\u0301n\u0303'; // á é í ó ú ñ
    log('Testing decompression of buffer with combining diacritical marks');

    log('Compressing string with combining marks');
    const compressed = await compressData(combiningMarksString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(combiningMarksString);
    log('Decompression of buffer with combining diacritical marks successful');
  });

  it('should decompress a buffer with characters from various scripts', async () => {
    const multiScriptString =
      'Latin: Hello, Cyrillic: Привет, Greek: Γειά σου, Arabic: مرحبا, Hebrew: שלום, Devanagari: नमस्ते, Chinese: 你好, Japanese: こんにちは, Korean: 안녕하세요';
    log('Testing decompression of buffer with characters from various scripts');

    log('Compressing multi-script string');
    const compressed = await compressData(multiScriptString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(multiScriptString);
    log('Decompression of buffer with characters from various scripts successful');
  });

  it('should handle decompression of a buffer with surrogate pairs', async () => {
    const surrogatePairsString = '𐐀𐐁𐐂𐐃𐐄𐐅𐐆𐐇𐐈𐐉𐐊𐐋𐐌𐐍𐐎𐐏𐐐𐐑𐐒𐐓𐐔𐐕𐐖𐐗𐐘𐐙𐐚𐐛𐐜𐐝𐐞𐐟';
    log('Testing decompression of buffer with surrogate pairs');

    log('Compressing string with surrogate pairs');
    const compressed = await compressData(surrogatePairsString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(surrogatePairsString);
    log('Decompression of buffer with surrogate pairs successful');
  });

  it('should decompress a buffer with Unicode control characters', async () => {
    const controlCharsString =
      '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f';
    log('Testing decompression of buffer with Unicode control characters');

    log('Compressing string with control characters');
    const compressed = await compressData(controlCharsString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(controlCharsString);
    log('Decompression of buffer with Unicode control characters successful');
  });

  it('should handle decompression of a buffer with Unicode punctuation and symbols', async () => {
    const punctuationAndSymbolsString = '☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯';
    log('Testing decompression of buffer with Unicode punctuation and symbols');

    log('Compressing string with punctuation and symbols');
    const compressed = await compressData(punctuationAndSymbolsString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(punctuationAndSymbolsString);
    log('Decompression of buffer with Unicode punctuation and symbols successful');
  });

  it('should decompress a large buffer with mixed Unicode characters', async () => {
    const mixedUnicodeString =
      'Hello, 世界! 😃 Здравствуй, мир! 🌍 こんにちは、世界！🎉 ' +
      '𐐀𐐁𐐂𐐃𐐄 ' +
      'a\u0301e\u0301i\u0301o\u0301u\u0301 ' +
      '☀☁☂☃☄';
    const largeString = mixedUnicodeString.repeat(1000);
    log('Testing decompression of large buffer with mixed Unicode characters');

    log('Compressing large mixed Unicode string');
    const compressed = await compressData(largeString);
    log(`Original size: ${Buffer.byteLength(largeString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(largeString);
    log('Decompression of large buffer with mixed Unicode characters successful');
  });

  it('should handle decompression of a buffer with zero-width Unicode characters', async () => {
    const zeroWidthString = 'visible​text​with​zero​width​spaces'; // Contains zero-width spaces
    log('Testing decompression of buffer with zero-width Unicode characters');

    log('Compressing string with zero-width characters');
    const compressed = await compressData(zeroWidthString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(zeroWidthString);
    log('Decompression of buffer with zero-width Unicode characters successful');
  });
});
