# goobs-cache

A versatile and efficient caching and state management solution for TypeScript and JavaScript applications. goobs-cache features multiple storage options, encryption, compression, and flexible data management across different environments.

## Features

- **Multiple storage options**:
  - Serverless caching with LRU strategy
  - Client-side storage (cookies and session storage)
- **Two-layer caching**: Automatically syncs between serverless and client-side storage for optimal performance and offline capabilities.
- **Cross-environment support**: Works seamlessly in both client-side and server-side environments.
- **Unified state management**: Provides functionality similar to React's useContext and useState.
- **Enhanced security**: Implements AES-GCM encryption for data protection.
- **Optimized storage**: Utilizes compression to reduce storage footprint.
- **TypeScript support**: Offers strong typing for improved developer experience.

## Installation

```bash
npm install goobs-cache
```

Or using yarn:

```bash
yarn add goobs-cache
```

## Basic Usage

Here's a simple example of how to use goobs-cache:

```typescript
import { serverless, session, cookie, twoLayer } from 'goobs-cache';

// Two-layer caching (automatically syncs between serverless and client-side)
await twoLayer.update('userProfile', 'userStore', { name: 'Alice', age: 28 });
const userProfile = await twoLayer.get('userProfile', 'userStore');
console.log(userProfile); // { name: 'Alice', age: 28 }

// Serverless caching
const serverlessAtom = serverless.atom('serverData', 'dataStore');
await serverlessAtom.set('Hello, Serverless!');
const serverValue = await serverlessAtom.get();
console.log(serverValue); // 'Hello, Serverless!'

// Client-side caching (session storage)
const sessionAtom = session.atom('Hello, Session!');
const [sessionValue, setSessionValue] = session.useAtom(sessionAtom);
console.log(sessionValue); // 'Hello, Session!'
setSessionValue('Updated Session Value');

// Client-side caching (cookies)
const cookieAtom = cookie.atom('cookieData', 'cookieStore');
await cookieAtom.set('Hello, Cookies!');
const cookieValue = await cookieAtom.get();
console.log(cookieValue); // 'Hello, Cookies!'

// Removal
await twoLayer.remove('userProfile', 'userStore');
await serverlessAtom.remove();
await cookieAtom.remove();

// Clearing all caches
await twoLayer.clear();
await serverless.clear();
await cookie.clear();

// Updating configuration
twoLayer.updateConfig();
serverless.updateConfig();
session.updateConfig();
cookie.updateConfig();
```

## Advanced Features

goobs-cache offers advanced capabilities for complex use cases:

- **Two-layer caching**: Automatically synchronizes data between serverless and client-side storage, providing seamless offline capabilities and improved performance.
- **Automatic client-side caching**: When using the serverless mode on the client-side, data is automatically cached in session storage for faster subsequent access.
- **Flexible storage options**: Choose between twoLayer, serverless, session, and cookie modes to best suit your application's needs.

## Configuration

Configure goobs-cache using a `.cache.config.ts` file in your project's root. Here's a comprehensive example:

```typescript
import { CacheConfig, EvictionPolicy, LogLevel } from 'goobs-cache';

const cacheConfiguration: CacheConfig = {
  serverless: {
    cacheSize: 10000,
    cacheMaxAge: 86400000,
    persistenceInterval: 600000,
    maxMemoryUsage: 1073741824,
    evictionPolicy: 'lru' as EvictionPolicy,
    prefetchThreshold: 0.9,
    forceReset: false,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-serverless',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  session: {
    cacheSize: 5000,
    cacheMaxAge: 1800000,
    evictionPolicy: 'lru' as EvictionPolicy,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-session',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  cookie: {
    cacheSize: 1000,
    cacheMaxAge: 604800000,
    maxCookieSize: 4096,
    evictionPolicy: 'lru' as EvictionPolicy,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-cookie',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  global: {
    keySize: 256,
    batchSize: 100,
    autoTuneInterval: 3600000,
    loggingEnabled: true,
    logLevel: 'debug' as LogLevel,
    logDirectory: 'logs',
  },
};

export default cacheConfiguration;
```

## TypeScript Support

goobs-cache is written in TypeScript and provides comprehensive type definitions for a great developer experience.

## Performance

goobs-cache is designed for high performance, with features like:

- Two-layer caching for optimal data access
- LRU caching strategy
- Compression to reduce data size

## Security

Security is a top priority in goobs-cache:

- AES-GCM encryption for data at rest
- Secure key management with regular key rotation
- Client-side encryption in browsers

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

goobs-cache is developed and maintained by Matthew Goluba.

## Contact

For questions or feedback:

- GitHub Issues: https://github.com/goobz22/goobs-cache/issues
- Email: mkgoluba@technologiesunlimited.net

Elevate your data management strategy with goobs-cache!
