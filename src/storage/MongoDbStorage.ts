'use server';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { StorageInterface, CacheItem } from './StorageInterface';
import { EncryptedValue } from '../types/DataTypes';
import getConfig from '../config/config';

/**
 * StorageDocument interface represents the structure of a document stored in MongoDB.
 * It includes the document ID, encrypted value, last accessed timestamp, and expiration date.
 */
interface StorageDocument {
  _id: string | ObjectId;
  value: EncryptedValue;
  lastAccessed: number;
  expirationDate: Date;
}

/**
 * MongoDbStorageImplementation class is an implementation of the StorageInterface using MongoDB.
 * It provides methods for connecting to MongoDB, performing CRUD operations on cache items,
 * and closing the MongoDB connection.
 */
class MongoDbStorageImplementation implements StorageInterface {
  private client: MongoClient;
  private db!: Db;
  private collection!: Collection<StorageDocument>;

  /**
   * Constructor for the MongoDbStorageImplementation class.
   * @param mongodbUri The MongoDB connection URI.
   * @param mongoPoolSize The maximum size of the MongoDB connection pool.
   */
  constructor(mongodbUri: string, mongoPoolSize: number) {
    this.client = new MongoClient(mongodbUri, {
      maxPoolSize: mongoPoolSize,
    });
  }

  /**
   * connect method establishes a connection to the MongoDB database.
   * It initializes the Db and Collection instances.
   */
  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
    this.collection = this.db.collection<StorageDocument>('reusablestore');
  }

  /**
   * get method retrieves a cache item from MongoDB using the provided key.
   * @param key The key of the cache item to retrieve.
   * @returns A Promise that resolves to the cache item if found, or undefined if not found.
   */
  async get(key: string): Promise<CacheItem<EncryptedValue> | undefined> {
    const doc = await this.collection.findOne(this.createFilter(key));
    if (doc) {
      return {
        value: doc.value,
        lastAccessed: doc.lastAccessed,
        expirationDate: doc.expirationDate,
      };
    }
    return undefined;
  }

  /**
   * set method sets a cache item in MongoDB using the provided key and item.
   * It performs an upsert operation, creating a new document if it doesn't exist or updating an existing one.
   * @param key The key of the cache item to set.
   * @param item The cache item to set.
   */
  async set(key: string, item: CacheItem<EncryptedValue>): Promise<void> {
    await this.collection.updateOne(
      this.createFilter(key),
      {
        $set: {
          value: item.value,
          lastAccessed: item.lastAccessed,
          expirationDate: item.expirationDate,
        },
      },
      { upsert: true },
    );
  }

  /**
   * remove method removes a cache item from MongoDB using the provided key.
   * @param key The key of the cache item to remove.
   */
  async remove(key: string): Promise<void> {
    await this.collection.deleteOne(this.createFilter(key));
  }

  /**
   * clear method removes all cache items from MongoDB.
   */
  async clear(): Promise<void> {
    await this.collection.deleteMany({});
  }

  /**
   * close method closes the MongoDB connection.
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * createFilter method creates a filter object for MongoDB queries based on the provided key.
   * It attempts to create an ObjectId from the key, or uses the key as a string if it's not a valid ObjectId.
   * @param key The key to create the filter for.
   * @returns An object with the _id field set to either an ObjectId or a string.
   */
  private createFilter(key: string): { _id: string | ObjectId } {
    try {
      return { _id: new ObjectId(key) };
    } catch {
      return { _id: key };
    }
  }
}

/**
 * createMongoDbStorage function creates a new instance of the MongoDbStorageImplementation.
 * It retrieves the configuration, creates the storage instance, and connects to MongoDB.
 * @returns A Promise that resolves to the StorageInterface instance using MongoDB.
 */
export async function createMongoDbStorage(): Promise<StorageInterface> {
  const config = await getConfig();
  const storage = new MongoDbStorageImplementation(config.mongodbUri, config.mongoPoolSize);
  await storage.connect();
  return storage;
}

/**
 * getFromMongoDb function retrieves a cache item from MongoDB using the provided storage and key.
 * @param storage The StorageInterface instance.
 * @param key The key of the cache item to retrieve.
 * @returns A Promise that resolves to the cache item if found, or undefined if not found.
 */
export async function getFromMongoDb(
  storage: StorageInterface,
  key: string,
): Promise<CacheItem<EncryptedValue> | undefined> {
  return await storage.get(key);
}

/**
 * setToMongoDb function sets a cache item in MongoDB using the provided storage, key, and item.
 * @param storage The StorageInterface instance.
 * @param key The key of the cache item to set.
 * @param item The cache item to set.
 */
export async function setToMongoDb(
  storage: StorageInterface,
  key: string,
  item: CacheItem<EncryptedValue>,
): Promise<void> {
  await storage.set(key, item);
}

/**
 * removeFromMongoDb function removes a cache item from MongoDB using the provided storage and key.
 * @param storage The StorageInterface instance.
 * @param key The key of the cache item to remove.
 */
export async function removeFromMongoDb(storage: StorageInterface, key: string): Promise<void> {
  await storage.remove(key);
}

/**
 * clearMongoDb function removes all cache items from MongoDB using the provided storage.
 * @param storage The StorageInterface instance.
 */
export async function clearMongoDb(storage: StorageInterface): Promise<void> {
  await storage.clear();
}

/**
 * closeMongoDbConnection function closes the MongoDB connection if the provided storage is an instance of MongoDbStorageImplementation.
 * @param storage The StorageInterface instance.
 */
export async function closeMongoDbConnection(storage: StorageInterface): Promise<void> {
  if (storage instanceof MongoDbStorageImplementation) {
    await storage.close();
  }
}
