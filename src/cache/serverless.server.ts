'use server';

import {
  R2Bucket,
  KVNamespace,
  ScheduledEvent,
  R2ListOptions,
  R2Objects,
} from '@cloudflare/workers-types';
import { ServerLogger } from 'goobs-testing';
import { ServerCompressionModule } from '../utils/compression.server';
import { ServerEncryptionModule, EncryptedData } from 'goobs-encryption';
import { GlobalConfig } from '../types';

interface CacheEntry<T> {
  value: T;
  expirationDate: number;
  lastUpdatedDate: number;
  lastAccessedDate: number;
  hitCount: number;
}

interface ServerlessCacheConfig {
  cacheMaxAge: number;
  compressionThreshold: number;
  encryptionEnabled: boolean;
  encryptionPassword: string;
}

interface Env {
  R2_BUCKET: R2Bucket;
  CACHE_CONFIG: KVNamespace;
}

class ServerlessR2Cache {
  private constructor(
    private config: ServerlessCacheConfig,
    private globalConfig: GlobalConfig,
    private r2Bucket: R2Bucket,
  ) {
    ServerLogger.initializeLogger(this.globalConfig);
    ServerCompressionModule.globalConfig = this.globalConfig;
    if (this.config.encryptionEnabled) {
      ServerEncryptionModule.initialize(this.config.encryptionPassword, this.globalConfig);
    }
  }

  static async create(
    config: ServerlessCacheConfig,
    globalConfig: GlobalConfig,
    r2Bucket: R2Bucket,
  ): Promise<ServerlessR2Cache> {
    return new ServerlessR2Cache(config, globalConfig, r2Bucket);
  }

  private getR2Key(identifier: string, storeName: string): string {
    return `${identifier}:${storeName}`;
  }

  async get<T>(identifier: string, storeName: string): Promise<T | null> {
    const key = this.getR2Key(identifier, storeName);
    try {
      const object = await this.r2Bucket.get(key);

      if (!object) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(await object.text());

      if (Date.now() > entry.expirationDate) {
        await this.r2Bucket.delete(key);
        return null;
      }

      entry.hitCount++;
      entry.lastAccessedDate = Date.now();
      await this.r2Bucket.put(key, JSON.stringify(entry));

      let value = entry.value;
      if (this.config.encryptionEnabled) {
        value = await ServerEncryptionModule.decrypt<T>(value as unknown as EncryptedData<T>);
      }
      if (typeof value === 'string' && value.startsWith('compressed:')) {
        const compressedString = value.slice(11); // Remove 'compressed:' prefix
        const decompressedString = await ServerCompressionModule.decompressData(compressedString);
        value = JSON.parse(decompressedString) as T;
      }

      return value;
    } catch (error) {
      await ServerLogger.error(`Error getting cache value for ${identifier}/${storeName}:`, {
        error,
      });
      return null;
    }
  }

  async set<T>(identifier: string, storeName: string, value: T): Promise<void> {
    const key = this.getR2Key(identifier, storeName);
    try {
      let processedValue: T | string | EncryptedData<T> = value;
      if (
        typeof processedValue === 'string' &&
        processedValue.length > this.config.compressionThreshold
      ) {
        const compressedData = await ServerCompressionModule.compressData(processedValue);
        if (compressedData !== null && compressedData.compressed) {
          processedValue = 'compressed:' + compressedData.data.toString();
        }
      }
      if (this.config.encryptionEnabled) {
        processedValue = await ServerEncryptionModule.encrypt(processedValue as T);
      }

      const entry: CacheEntry<typeof processedValue> = {
        value: processedValue,
        expirationDate: Date.now() + this.config.cacheMaxAge,
        lastUpdatedDate: Date.now(),
        lastAccessedDate: Date.now(),
        hitCount: 0,
      };

      await this.r2Bucket.put(key, JSON.stringify(entry));
    } catch (error) {
      await ServerLogger.error(`Error setting cache value for ${identifier}/${storeName}:`, {
        error,
      });
    }
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const key = this.getR2Key(identifier, storeName);
    try {
      await this.r2Bucket.delete(key);
    } catch (error) {
      await ServerLogger.error(`Error removing cache value for ${identifier}/${storeName}:`, {
        error,
      });
    }
  }

  async clear(): Promise<void> {
    try {
      let cursor: string | undefined;
      do {
        const listOptions: R2ListOptions = { limit: 1000 };
        if (cursor) listOptions.cursor = cursor;
        const list: R2Objects = await this.r2Bucket.list(listOptions);
        await Promise.all(list.objects.map((obj) => this.r2Bucket.delete(obj.key)));
        cursor = list.truncated ? list.cursor : undefined;
      } while (cursor);
    } catch (error) {
      await ServerLogger.error('Error clearing cache:', { error });
    }
  }

  async cleanupExpiredItems(): Promise<void> {
    try {
      let cursor: string | undefined;
      const now = Date.now();
      do {
        const listOptions: R2ListOptions = { limit: 1000 };
        if (cursor) listOptions.cursor = cursor;
        const list: R2Objects = await this.r2Bucket.list(listOptions);
        await Promise.all(
          list.objects.map(async (obj) => {
            const entry: CacheEntry<unknown> = JSON.parse(
              await (await this.r2Bucket.get(obj.key))!.text(),
            );
            if (entry.expirationDate < now) {
              await this.r2Bucket.delete(obj.key);
            }
          }),
        );
        cursor = list.truncated ? list.cursor : undefined;
      } while (cursor);
    } catch (error) {
      await ServerLogger.error('Error cleaning up expired items:', { error });
    }
  }
}

let serverlessCache: ServerlessR2Cache | null = null;

async function initializeServerlessCache(env: Env): Promise<ServerlessR2Cache> {
  if (!serverlessCache) {
    const configString = await env.CACHE_CONFIG.get('currentConfig');
    let config: ServerlessCacheConfig;
    let globalConfig: GlobalConfig;

    if (configString) {
      ({ config, globalConfig } = JSON.parse(configString));
    } else {
      config = {
        cacheMaxAge: 3600000,
        compressionThreshold: 1024,
        encryptionEnabled: false,
        encryptionPassword: 'default-password',
      };
      globalConfig = {
        keySize: 256,
        batchSize: 100,
        autoTuneInterval: 3600000,
        loggingEnabled: true,
        logLevel: 'debug',
        logDirectory: 'logs',
        initialize: () => {},
      };
    }

    serverlessCache = await ServerlessR2Cache.create(config, globalConfig, env.R2_BUCKET);
  }
  return serverlessCache;
}

function createServerlessAtom(env: Env, identifier: string, storeName: string) {
  return {
    get: async <T>(): Promise<T | null> => {
      const cache = await initializeServerlessCache(env);
      return cache.get<T>(identifier, storeName);
    },
    set: async <T>(value: T): Promise<void> => {
      const cache = await initializeServerlessCache(env);
      await cache.set<T>(identifier, storeName, value);
    },
    remove: async (): Promise<void> => {
      const cache = await initializeServerlessCache(env);
      await cache.remove(identifier, storeName);
    },
  };
}

export const serverless = {
  atom: createServerlessAtom,
  clear: async (env: Env): Promise<void> => {
    const cache = await initializeServerlessCache(env);
    await cache.clear();
  },
  updateConfig: async (
    env: Env,
    newConfig: ServerlessCacheConfig,
    newGlobalConfig: GlobalConfig,
  ): Promise<void> => {
    await env.CACHE_CONFIG.put(
      'currentConfig',
      JSON.stringify({
        config: newConfig,
        globalConfig: newGlobalConfig,
      }),
    );
    serverlessCache = null; // Force re-initialization with new config
    if (newConfig.encryptionEnabled) {
      ServerEncryptionModule.initialize(newConfig.encryptionPassword, newGlobalConfig);
    }
  },
};

const serverlessModule = {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Simple routing
      if (url.pathname === '/get') {
        const { identifier, storeName } = await request.json();
        const result = await serverless.atom(env, identifier, storeName).get();
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (url.pathname === '/set') {
        const { identifier, storeName, value } = await request.json();
        await serverless.atom(env, identifier, storeName).set(value);
        return new Response('OK');
      } else if (url.pathname === '/remove') {
        const { identifier, storeName } = await request.json();
        await serverless.atom(env, identifier, storeName).remove();
        return new Response('OK');
      } else if (url.pathname === '/clear') {
        await serverless.clear(env);
        return new Response('Cache cleared');
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      await ServerLogger.error('Worker error:', { error });
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const cache = await initializeServerlessCache(env);
    await cache.cleanupExpiredItems();
  },
};

// Error handling
addEventListener('unhandledrejection', async (event: PromiseRejectionEvent) => {
  await ServerLogger.error('Unhandled Rejection:', {
    reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  });
});

export default serverlessModule;
