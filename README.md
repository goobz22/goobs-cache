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
import { set, get, remove } from 'goobs-cache';

// Two-layer caching (automatically syncs between serverless and client-side)
await set('userProfile', 'userStore', 'twoLayer', { name: 'Alice', age: 28 });
const userProfile = await get('userProfile', 'userStore', 'twoLayer');
console.log(userProfile); // { name: 'Alice', age: 28 }

// Serverless caching
await set('serverData', 'dataStore', 'server', 'Hello, Serverless!');
const serverValue = await get('serverData', 'dataStore', 'server');
console.log(serverValue); // 'Hello, Serverless!'

// Client-side caching (session storage)
await set('clientData', 'clientStore', 'client', { items: [1, 2, 3] });
const clientValue = await get('clientData', 'clientStore', 'client');
console.log(clientValue); // { items: [1, 2, 3] }

// Client-side caching (cookies)
await set('cookieData', 'cookieStore', 'cookie', 'Hello, Cookies!');
const cookieValue = await get('cookieData', 'cookieStore', 'cookie');
console.log(cookieValue); // 'Hello, Cookies!'

// Removal
await remove('userProfile', 'userStore', 'twoLayer');
await remove('serverData', 'dataStore', 'server');
await remove('clientData', 'clientStore', 'client');
await remove('cookieData', 'cookieStore', 'cookie');
```

## Advanced Features

goobs-cache offers advanced capabilities for complex use cases:

- **Two-layer caching**: Automatically synchronizes data between serverless and client-side storage, providing seamless offline capabilities and improved performance.
- **Automatic client-side caching**: When using the 'server' mode on the client-side, data is automatically cached in session storage for faster subsequent access.
- **Flexible storage options**: Choose between 'twoLayer', 'server', 'client', and 'cookie' modes to best suit your application's needs.

## Configuration

Configure goobs-cache using a `.reusablestore.json` file in your project's root:

```json
{
  "algorithm": "aes-256-gcm",
  "keyCheckIntervalMs": 86400000,
  "keyRotationIntervalMs": 7776000000,
  "compressionLevel": -1,
  "cacheSize": 10000,
  "cacheMaxAge": 86400000,
  "persistenceInterval": 600000,
  "maxMemoryUsage": 1073741824,
  "evictionPolicy": "lru",
  "forceReset": false,
  "encryptionPassword": "your-secure-encryption-password-here"
}
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
