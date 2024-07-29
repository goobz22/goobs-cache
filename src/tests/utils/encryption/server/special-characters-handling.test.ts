import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('special-characters-handling-encryption.log');
const log = createLogger(logStream);

describe('Special Characters Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'special-chars-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle ASCII special characters', async () => {
    const asciiSpecialChars = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`;
    const data = new TextEncoder().encode(asciiSpecialChars);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(asciiSpecialChars);
  });

  it('should handle Unicode special characters', async () => {
    const unicodeSpecialChars =
      '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
    const data = new TextEncoder().encode(unicodeSpecialChars);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(unicodeSpecialChars);
  });

  it('should handle emoji characters', async () => {
    const emojiChars =
      '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾';
    const data = new TextEncoder().encode(emojiChars);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(emojiChars);
  });

  it('should handle mixed special characters', async () => {
    const mixedSpecialChars =
      `!@#$%^&*()_+-=[]{};':",./<>?\\|` +
      '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ' +
      '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾';
    const data = new TextEncoder().encode(mixedSpecialChars);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(mixedSpecialChars);
  });
});
