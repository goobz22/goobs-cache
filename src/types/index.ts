export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

export interface GlobalConfig {
  keySize?: number;
  batchSize?: number;
  autoTuneInterval?: number;
  loggingEnabled: boolean;
  logLevel: LogLevel;
  logDirectory: string;
  initialize: (config: Partial<GlobalConfig>) => void;
}
