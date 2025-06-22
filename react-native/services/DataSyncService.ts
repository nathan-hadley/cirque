import NetInfo from '@react-native-community/netinfo';
import { Problem } from '../models/problems';
import { cacheService } from './CacheService';
import { databaseService } from './DatabaseService';

export enum SyncStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  SYNCING = 'syncing',
  ERROR = 'error',
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime?: Date;
  pendingChanges: number;
  error?: string;
}

class DataSyncService {
  private syncState: SyncState = {
    status: SyncStatus.OFFLINE,
    pendingChanges: 0,
  };
  private listeners: ((state: SyncState) => void)[] = [];
  private isOnline = false;

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener(): Promise<void> {
    // Initialize database
    await databaseService.initialize();

    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = !!state.isConnected;

      if (!wasOnline && this.isOnline) {
        // Went from offline to online - trigger sync
        this.triggerSync();
      }

      this.updateSyncStatus(this.isOnline ? SyncStatus.ONLINE : SyncStatus.OFFLINE);
    });

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = !!state.isConnected;
    this.updateSyncStatus(this.isOnline ? SyncStatus.ONLINE : SyncStatus.OFFLINE);
  }

  // Get problems with smart fallback strategy
  async getProblems(circuitId: string, forceRefresh = false): Promise<Problem[]> {
    try {
      // 1. Try cache first (if not forcing refresh and online)
      if (!forceRefresh && this.isOnline) {
        const cachedProblems = cacheService.getCachedProblems(circuitId);
        if (cachedProblems && cachedProblems.length > 0) {
          console.log('Returning cached problems');
          return cachedProblems;
        }
      }

      // 2. If online, try to fetch from network
      if (this.isOnline && (forceRefresh || !cacheService.getCachedProblems(circuitId))) {
        try {
          const networkProblems = await this.fetchProblemsFromNetwork(circuitId);
          if (networkProblems.length > 0) {
            // Cache the fresh data
            cacheService.cacheProblems(circuitId, networkProblems);
            // Save to database for offline access
            await databaseService.saveProblems(networkProblems);
            console.log('Returning fresh network data');
            return networkProblems;
          }
        } catch (networkError) {
          console.warn('Network fetch failed, falling back to local data:', networkError);
        }
      }

      // 3. Fallback to database (offline or network failed)
      const dbProblems = await databaseService.getProblems({ topo: circuitId });
      if (dbProblems.length > 0) {
        console.log('Returning database problems');
        return dbProblems;
      }

      console.log('No problems found in any source');
      return [];
    } catch (error) {
      console.error('Error getting problems:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateSyncStatus(SyncStatus.ERROR, errorMessage);
      return [];
    }
  }

  // Get single problem with fallback strategy
  async getProblem(problemId: string): Promise<Problem | null> {
    try {
      // 1. Try cache first
      const cachedProblem = cacheService.getCachedProblem(problemId);
      if (cachedProblem) {
        return cachedProblem;
      }

      // 2. Try database
      const dbProblem = await databaseService.getProblem(problemId);
      if (dbProblem) {
        // Cache it for next time
        cacheService.cacheProblem(dbProblem);
        return dbProblem;
      }

      // 3. If online, try network (implement based on your API)
      if (this.isOnline) {
        const networkProblem = await this.fetchProblemFromNetwork(problemId);
        if (networkProblem) {
          cacheService.cacheProblem(networkProblem);
          await databaseService.saveProblem(networkProblem);
          return networkProblem;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting problem:', error);
      return null;
    }
  }

  // Search problems with offline support
  async searchProblems(query: {
    topo?: string;
    subarea?: string;
    grade?: string;
    location?: { latitude: number; longitude: number; radiusKm?: number };
  }): Promise<Problem[]> {
    try {
      if (query.location) {
        return await databaseService.getProblemsNearLocation(
          query.location.latitude,
          query.location.longitude,
          query.location.radiusKm
        );
      }

      return await databaseService.getProblems({
        topo: query.topo,
        subarea: query.subarea,
        grade: query.grade,
      });
    } catch (error) {
      console.error('Error searching problems:', error);
      return [];
    }
  }

  // Sync data when going online
  private async triggerSync(): Promise<void> {
    if (!this.isOnline) return;

    this.updateSyncStatus(SyncStatus.SYNCING);

    try {
      // Get all unique topos from database to sync
      const stats = await databaseService.getStats();
      const toposToSync = stats.problemsByTopo.map(item => item.topo);

      for (const topo of toposToSync) {
        try {
          const networkProblems = await this.fetchProblemsFromNetwork(topo);
          if (networkProblems.length > 0) {
            cacheService.cacheProblems(topo, networkProblems);
            await databaseService.saveProblems(networkProblems);
          }
        } catch (error) {
          console.warn(`Failed to sync topo ${topo}:`, error);
        }
      }

      this.updateSyncStatus(SyncStatus.ONLINE);
      this.syncState.lastSyncTime = new Date();
      this.notifyListeners();
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.updateSyncStatus(SyncStatus.ERROR, errorMessage);
    }
  }

  // Network fetch methods (implement based on your API)
  private async fetchProblemsFromNetwork(circuitId: string): Promise<Problem[]> {
    // TODO: Implement actual network fetch based on your API
    // This is a placeholder that should be replaced with actual API calls
    throw new Error('Network fetch not implemented - add your API integration here');
  }

  private async fetchProblemFromNetwork(problemId: string): Promise<Problem | null> {
    // TODO: Implement actual network fetch based on your API
    throw new Error('Network fetch not implemented - add your API integration here');
  }

  // Cache management
  invalidateCache(circuitId?: string): void {
    if (circuitId) {
      cacheService.invalidateProblemsCache(circuitId);
    } else {
      cacheService.clear();
    }
  }

  // Sync state management
  private updateSyncStatus(status: SyncStatus, error?: string): void {
    this.syncState.status = status;
    this.syncState.error = error;
    this.notifyListeners();
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  addSyncStateListener(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncState));
  }

  // Data statistics
  async getDataStats(): Promise<{
    cache: { totalKeys: number; problemCaches: number; individualProblems: number };
    database: { totalProblems: number; problemsByTopo: { topo: string; count: number }[] };
    sync: SyncState;
  }> {
    const cacheStats = cacheService.getCacheStats();
    const dbStats = await databaseService.getStats();
    
    return {
      cache: cacheStats,
      database: dbStats,
      sync: this.getSyncState(),
    };
  }

  // Force refresh data
  async refreshData(circuitId: string): Promise<Problem[]> {
    this.invalidateCache(circuitId);
    return this.getProblems(circuitId, true);
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    cacheService.clear();
    await databaseService.clearProblems();
    this.syncState.pendingChanges = 0;
    this.notifyListeners();
  }
}

export const dataSyncService = new DataSyncService();
export default dataSyncService;