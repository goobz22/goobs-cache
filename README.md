# goobs-cache

A versatile and efficient caching solution with two-level caching, encryption, compression, and multiple storage options. goobs-cache is designed to provide high-performance caching capabilities for TypeScript and Node.js applications, with a focus on data security, scalability, and extensibility. A lightweight powerful redis alternative

## Features

- Two-level caching: goobs-cache utilizes a two-level caching architecture, consisting of an in-memory cache (e.g., using LRU cache) and a persistent storage layer (e.g., MongoDB). This approach allows for fast access to frequently used data while ensuring data durability.

- Encryption: Data stored in goobs-cache can be encrypted using industry-standard encryption algorithms (e.g., AES-256-GCM) to protect sensitive information. The encryption keys are securely managed and can be automatically rotated at configurable intervals.

- Data compression: To optimize storage utilization and reduce network overhead, goobs-cache supports data compression. Compressed data is transparently decompressed when retrieved from the cache.

- Multiple storage options: goobs-cache offers flexibility in storage options, allowing you to choose between in-memory storage for high-speed caching and MongoDB for persistent storage. You can configure the storage type based on your application's requirements.

- Batch writing: To optimize I/O operations and improve write performance, goobs-cache implements batch writing. Multiple write operations are grouped together and executed in batches, reducing the number of individual write operations to the storage layer.

- Prefetching: goobs-cache includes a prefetching mechanism that automatically retrieves frequently accessed items and stores them in the cache. This feature helps minimize cache misses and improves overall performance by anticipating future data requests.

- Automatic key rotation: To enhance security, goobs-cache supports automatic rotation of encryption keys. Key rotation helps mitigate the risk of key compromise and ensures that data remains protected over time.

- Access tracking: goobs-cache tracks data access patterns and uses this information to make intelligent decisions about cache eviction and prefetching. Frequently accessed items are prioritized and kept in the cache, while less frequently accessed items may be evicted when the cache reaches its capacity.

- TypeScript support: goobs-cache is written in TypeScript, providing type safety and improved developer experience. TypeScript's static typing catches potential errors at compile-time and enables better code maintainability and refactoring.

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

Here's a basic example of how to use goobs-cache:

```typescript
import { get, set, remove, DataValue } from 'goobs-cache';

// Set a value in the cache
const value: DataValue = { type: 'string', value: 'Hello, World!' };
await set('myKey', value, new Date(Date.now() + 3600000)); // Expires in 1 hour

// Get a value from the cache
const retrievedValue = await get('myKey');
console.log(retrievedValue); // { type: 'string', value: 'Hello, World!' }

// Remove a value from the cache
await remove('myKey');
```

## Configuration

goobs-cache can be configured by creating a .reusablestore.json file in your project's root directory. You can adjust settings such as:

- Cache size: Specify the maximum number of items to store in the cache.

- Compression level: Set the desired level of data compression (e.g., -1 for default, 0 for no compression, 1 for best speed, 9 for best compression).

- Encryption algorithm: Choose the encryption algorithm to use for data security (e.g., AES-256-GCM, AES-192-GCM, AES-128-GCM).

- Storage type: Select the storage type to use (e.g., memory for in-memory caching, MongoDB for persistent storage).

- Batch writing settings: Configure the batch size and interval for batch write operations.

- Prefetching threshold: Set the threshold for triggering prefetching of frequently accessed items.

Here's an example of a .reusablestore.json configuration file:

```json
{
  "cacheSize": 10000,
  "compressionLevel": -1,
  "algorithm": "aes-256-gcm",
  "storageType": "memory",
  "batchSize": 100,
  "persistenceInterval": 600000,
  "prefetchThreshold": 5
}
```

Please refer to the .reusablestore.json file for all available options and their default values.

## Advanced Usage

goobs-cache aims to be a TypeScript alternative to Redis, supporting various data types including strings, lists, sets, hashes, streams, sorted sets, HyperLogLog, and geospatial items. Refer to the DataTypes.ts file for more details on the supported types.

The library provides a set of intuitive APIs for interacting with the cache, such as get, set, remove, expire, and more. You can also leverage advanced features like batch operations, prefetching, and access tracking to optimize cache performance and efficiency.

For more advanced use cases and detailed API documentation, please refer to the project's wiki or the TypeScript source code.

## Contributing

Contributions are welcome! If you encounter any issues, have suggestions for improvements, or would like to contribute new features, please feel free to submit a pull request. Make sure to follow the project's coding style and guidelines

## License

This project is licensed under the MIT License.

## Author

goobs-cache is developed and maintained by Matthew Goluba.

## Contact

If you have any questions, suggestions, or feedback, please feel free to reach out to us through the following channels:

GitHub Issues: https://github.com/goobz22/goobs-cache/issues

Email: mkgoluba@technologiesunlimited.net

We appreciate your interest in goobs-cache and look forward to hearing from you.

Use as you see fit.

If you need expanded capabilities or have input on the current state of things feel free to comment. Going to include testing and monitoring and logging to allow ability to see cache hits and database usage. Believe there is a good opportunity for doing data backups through logging the flow of data to the database. Prefetching can and will be optimized.

Happy caching!
