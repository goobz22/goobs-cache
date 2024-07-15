# goobs-cache

A versatile and efficient caching and state management solution for TypeScript and JavaScript applications. goobs-cache features multiple storage options, encryption, compression, and flexible data management across different environments.

## Features

- **Multiple storage options**:

  - Server-side caching with LRU strategy
  - Client-side storage (cookies and session storage)

- **Cross-environment support**: Works seamlessly in both client-side and server-side environments.
- **Unified state management**: Provides functionality similar to React's useContext, useState, and Jotai atoms.
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

// Server-side caching
await set('serverIdentifier', 'serverStore', 'server', 'Hello, Server!');
const serverValue = await get('serverIdentifier', 'serverStore', 'server');
console.log(serverValue); // 'Hello, Server!'

// Client-side caching (session storage)
await set('clientIdentifier', 'clientStore', 'client', { name: 'John', age: 30 });
const clientValue = await get('clientIdentifier', 'clientStore', 'client');
console.log(clientValue); // { name: 'John', age: 30 }

// Client-side caching (cookies)
await set('cookieIdentifier', 'cookieStore', 'cookie', [1, 2, 3]);
const cookieValue = await get('cookieIdentifier', 'cookieStore', 'cookie');
console.log(cookieValue); // [1, 2, 3]

// Removal
await remove('serverIdentifier', 'serverStore', 'server');
await remove('clientIdentifier', 'clientStore', 'client');
await remove('cookieIdentifier', 'cookieStore', 'cookie');
```

## Advanced Features

goobs-cache offers advanced capabilities for complex use cases:

- **Atom-based state management**: Similar to Jotai, allowing for fine-grained reactivity.
- **Context API**: Prevents prop drilling in React applications.

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
