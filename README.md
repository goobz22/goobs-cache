# goobs-cache

A versatile and efficient caching and state management solution for TypeScript and Node.js applications. goobs-cache features multiple storage options including two-level server caching, client-side session storage, and in-memory caching, along with encryption, compression, and flexible data management across different environments.

goobs-cache aims to provide a comprehensive solution for data management, with the potential to replace or complement various existing tools and technologies:

- In-memory data stores
- Key-value storage services
- React state management solutions
- Browser's localStorage and sessionStorage
- Server-side session management tools
- Database caching layers

By adopting goobs-cache, you can consolidate your data management strategy with a single, powerful solution that works across your stack.

## Features

- Multiple storage options:

  - Server-side two-level caching
  - Client-side session storage
  - In-memory caching

- Cross-environment support: Works in both client-side and server-side environments.

- Unified state management: Provides functionality similar to React's useContext, useState, and Jotai atoms.

- Encryption: Implements AES-GCM encryption for enhanced data security.

- Compression: Utilizes gzip compression to optimize storage utilization.

- Batch writing: Improves write performance through batched operations.

- Access tracking: Tracks key access patterns for potential optimization.

- TypeScript support: Provides type safety and improved developer experience.

## Installation

Install goobs-cache using npm:

```bash
npm install goobs-cache
```

Or using yarn:

```bash
yarn add goobs-cache
```

## Usage

Here's a basic example of how goobs-cache can be used for different storage types:

```typescript
import { get, set, remove } from 'goobs-cache';

// Server-side caching
await set('myKey', 'Hello, World!', new Date(Date.now() + 3600000), 'server'); // Expires in 1 hour
const serverValue = await get('myKey', 'server');
console.log(serverValue); // { value: 'Hello, World!' }

// Client-side caching
await set('clientKey', { name: 'John', age: 30 }, new Date(Date.now() + 1800000), 'client'); // Expires in 30 minutes
const clientValue = await get('clientKey', 'client');
console.log(clientValue); // { value: { name: 'John', age: 30 } }

// In-memory caching
await set('memoryKey', [1, 2, 3], new Date(Date.now() + 300000), 'memory'); // Expires in 5 minutes
const memoryValue = await get('memoryKey', 'memory');
console.log(memoryValue); // { value: [1, 2, 3] }

// Unified removal across all storage types
await remove('myKey', 'server');
await remove('clientKey', 'client');
await remove('memoryKey', 'memory');
```

## Configuration

goobs-cache can be configured using a .reusablestore.json file in your project's root directory. Available settings include:

- Cache size
- Compression level
- Encryption algorithm
- Batch writing settings
- Prefetching threshold

Example configuration:

```json
{
  "cacheSize": 10000,
  "compressionLevel": -1,
  "algorithm": "aes-256-gcm",
  "batchSize": 100,
  "persistenceInterval": 600000,
  "prefetchThreshold": 5
}
```

## Advanced Usage

goobs-cache provides additional features for more complex use cases:

- Atom-based state management
- Context API for prop drilling prevention
- Reducers and dispatch for complex state logic
- Selectors for optimized state reading
- Batched updates for performance optimization

For detailed documentation and advanced use cases, refer to the project's wiki or TypeScript source code.

## Roadmap

We're constantly working to expand capabilities and optimize performance. Future goals include:

- Performance benchmarking against Redis, Vercel KV, and other solutions
- Enhanced prefetching mechanisms for improved performance in complex scenarios
- Automatic key rotation for increased security
- Comprehensive testing, monitoring, and logging across different environments
- Innovative approaches to data backups
- Further optimization of compression and encryption processes
- Extended TypeScript type inference for even better developer experience

## Contributing

We welcome contributions to make goobs-cache even better! If you have ideas for improvements or new features, please submit a pull request or open an issue for discussion.

## License

This project is licensed under the MIT License.

## Author

goobs-cache is developed and maintained by Matthew Goluba.

## Contact

For questions, suggestions, or feedback, reach out through:

GitHub Issues: https://github.com/goobz22/goobs-cache/issues

Email: mkgoluba@technologiesunlimited.net

We're excited about goobs-cache and its potential to streamline data management in web applications. Your feedback is crucial in helping us improve and expand the capabilities of goobs-cache.

Elevate your data management strategy with goobs-cache!
