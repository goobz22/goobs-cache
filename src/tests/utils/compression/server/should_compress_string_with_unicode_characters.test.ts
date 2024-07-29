import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-string-with-unicode-characters.log');
const log = createLogger(logStream);

describe('Compression of String with Unicode Characters', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a string with Basic Multilingual Plane (BMP) characters', async () => {
    const bmpString = 'Hello, 世界! Здравствуй, мир! こんにちは、世界！';
    log('Testing compression of string with BMP characters');

    log('Compressing BMP string');
    const compressed = await compressData(bmpString);
    log(`Original size: ${Buffer.byteLength(bmpString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(bmpString);
    log('Compression and decompression of string with BMP characters successful');
  });

  it('should handle compression of a string with Supplementary Multilingual Plane (SMP) characters', async () => {
    const smpString =
      '𠜎𠜱𠝹𠱓𠱸𠲖𠳏𠳕𠴕𠵼𠵿𠸎𠸏𠹷𠺝𠺢𠻗𠻹𠻺𠼭𠼮𠽌𠾴𠾼𠿪𡁜𡁯𡁵𡁶𡁻𡃁𡃉𡇙𢃇𢞵𢫕𢭃𢯊𢱑𢱕𢳂𢴈𢵌𢵧𢺳𣲷𤓓𤶸𤷪𥄫𦉘𦟌𦧲𦧺𧨾𨅝𨈇𨋢𨳊𨳍𨳒𩶘';
    log('Testing compression of string with SMP characters');

    log('Compressing SMP string');
    const compressed = await compressData(smpString);
    log(`Original size: ${Buffer.byteLength(smpString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(smpString);
    log('Compression and decompression of string with SMP characters successful');
  });

  it('should compress a string with Emoji characters', async () => {
    const emojiString =
      '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯';
    log('Testing compression of string with Emoji characters');

    log('Compressing Emoji string');
    const compressed = await compressData(emojiString);
    log(`Original size: ${Buffer.byteLength(emojiString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(emojiString);
    log('Compression and decompression of string with Emoji characters successful');
  });

  it('should handle compression of a string with combining diacritical marks', async () => {
    const combiningMarksString = 'a\u0301e\u0301i\u0301o\u0301u\u0301n\u0303'; // á é í ó ú ñ
    log('Testing compression of string with combining diacritical marks');

    log('Compressing string with combining marks');
    const compressed = await compressData(combiningMarksString);
    log(`Original size: ${Buffer.byteLength(combiningMarksString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(combiningMarksString);
    log('Compression and decompression of string with combining diacritical marks successful');
  });

  it('should compress a string with characters from various scripts', async () => {
    const multiScriptString =
      'Latin: Hello, Cyrillic: Привет, Greek: Γειά σου, Arabic: مرحبا, Hebrew: שלום, Devanagari: नमस्ते, Chinese: 你好, Japanese: こんにちは, Korean: 안녕하세요';
    log('Testing compression of string with characters from various scripts');

    log('Compressing multi-script string');
    const compressed = await compressData(multiScriptString);
    log(`Original size: ${Buffer.byteLength(multiScriptString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(multiScriptString);
    log('Compression and decompression of string with characters from various scripts successful');
  });

  it('should handle compression of a string with surrogate pairs', async () => {
    const surrogatePairsString = '𐐀𐐁𐐂𐐃𐐄𐐅𐐆𐐇𐐈𐐉𐐊𐐋𐐌𐐍𐐎𐐏𐐐𐐑𐐒𐐓𐐔𐐕𐐖𐐗𐐘𐐙𐐚𐐛𐐜𐐝𐐞𐐟';
    log('Testing compression of string with surrogate pairs');

    log('Compressing string with surrogate pairs');
    const compressed = await compressData(surrogatePairsString);
    log(`Original size: ${Buffer.byteLength(surrogatePairsString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(surrogatePairsString);
    log('Compression and decompression of string with surrogate pairs successful');
  });

  it('should compress a string with Unicode control characters', async () => {
    const controlCharsString =
      '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f';
    log('Testing compression of string with Unicode control characters');

    log('Compressing string with control characters');
    const compressed = await compressData(controlCharsString);
    log(`Original size: ${Buffer.byteLength(controlCharsString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(controlCharsString);
    log('Compression and decompression of string with Unicode control characters successful');
  });

  it('should handle compression of a string with Unicode punctuation and symbols', async () => {
    const punctuationAndSymbolsString = '☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯';
    log('Testing compression of string with Unicode punctuation and symbols');

    log('Compressing string with punctuation and symbols');
    const compressed = await compressData(punctuationAndSymbolsString);
    log(`Original size: ${Buffer.byteLength(punctuationAndSymbolsString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(punctuationAndSymbolsString);
    log('Compression and decompression of string with Unicode punctuation and symbols successful');
  });

  it('should compress a large string with mixed Unicode characters', async () => {
    const mixedUnicodeString =
      'Hello, 世界! 😃 Здравствуй, мир! 🌍 こんにちは、世界！🎉 ' +
      '𐐀𐐁𐐂𐐃𐐄 ' +
      'a\u0301e\u0301i\u0301o\u0301u\u0301 ' +
      '☀☁☂☃☄';
    const largeString = mixedUnicodeString.repeat(1000);
    log('Testing compression of large string with mixed Unicode characters');

    log('Compressing large mixed Unicode string');
    const compressed = await compressData(largeString);
    log(`Original size: ${Buffer.byteLength(largeString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(largeString);
    log('Compression and decompression of large string with mixed Unicode characters successful');
  });

  it('should handle compression of a string with zero-width Unicode characters', async () => {
    const zeroWidthString = 'visible​text​with​zero​width​spaces'; // Contains zero-width spaces
    log('Testing compression of string with zero-width Unicode characters');

    log('Compressing string with zero-width characters');
    const compressed = await compressData(zeroWidthString);
    log(`Original size: ${Buffer.byteLength(zeroWidthString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(zeroWidthString);
    log('Compression and decompression of string with zero-width Unicode characters successful');
  });
});
