# goobs-cache

A versatile and efficient caching and state management solution for TypeScript and JavaScript applications. goobs-cache features multiple storage options, encryption, compression, and flexible data management across different environments.

## Features

- **Multiple storage options**:

  - Server-side caching with LRU strategy
  - Client-side storage (cookies and session storage)
  - In-memory caching

- **Cross-environment support**: Works seamlessly in both client-side and server-side environments.

- **Unified state management**: Provides functionality similar to React's useContext, useState, and Jotai atoms.

- **Enhanced security**: Implements AES-GCM encryption for data protection.

- **Optimized storage**: Utilizes compression to reduce storage footprint.

- **Performance optimization**:

  - Batch writing for improved write performance
  - Access tracking for intelligent prefetching
  - Auto-tuning capabilities for optimal cache performance

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
await set('serverKey', 'Hello, Server!', new Date(Date.now() + 3600000), 'server');
const serverValue = await get('serverKey', 'server');
console.log(serverValue); // { value: 'Hello, Server!' }

// Client-side caching (session storage)
await set('clientKey', { name: 'John', age: 30 }, new Date(Date.now() + 1800000), 'client');
const clientValue = await get('clientKey', 'client');
console.log(clientValue); // { value: { name: 'John', age: 30 } }

// Client-side caching (cookies)
await set('cookieKey', [1, 2, 3], new Date(Date.now() + 300000), 'cookie');
const cookieValue = await get('cookieKey', 'cookie');
console.log(cookieValue); // { value: [1, 2, 3] }

// Removal
await remove('serverKey', 'server');
await remove('clientKey', 'client');
await remove('cookieKey', 'cookie');
```

## Advanced Features

goobs-cache offers advanced capabilities for complex use cases:

- **Atom-based state management**: Similar to Jotai, allowing for fine-grained reactivity.
- **Context API**: Prevents prop drilling in React applications.
- **Batched updates**: Optimizes performance by grouping multiple updates.
- **Auto-tuning**: Automatically adjusts cache size and eviction policies for optimal performance.
- **Prefetching**: Intelligently loads related data based on access patterns.

## Configuration

Configure goobs-cache using a `.reusablestore.json` file in your project's root:

```json
{
  "cacheSize": 10000,
  "cacheMaxAge": 3600000,
  "compressionLevel": 6,
  "algorithm": "aes-256-gcm",
  "keySize": 256,
  "batchSize": 100,
  "autoTuneInterval": 300000,
  "prefetchThreshold": 5
}
```

## TypeScript Support

goobs-cache is written in TypeScript and provides comprehensive type definitions for a great developer experience.

## Performance

goobs-cache is designed for high performance, with features like:

- Two-level caching on the server for fast access
- Intelligent prefetching based on access patterns
- Compression to reduce data size
- Batch writing to minimize I/O operations

## Security

Security is a top priority in goobs-cache:

- AES-GCM encryption for data at rest
- Secure key management
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
