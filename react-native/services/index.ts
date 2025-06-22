// Data layer services
export { cacheService } from './CacheService';
export { databaseService } from './DatabaseService';
export { dataSyncService, SyncStatus } from './DataSyncService';

// Types
export type { CacheEntry } from './CacheService';
export type { SyncState } from './DataSyncService';

// Hooks
export { useProblems, useDataStats } from '../hooks/useProblems';