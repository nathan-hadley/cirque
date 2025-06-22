import { useState, useEffect, useCallback } from 'react';
import { Problem } from '../models/problems';
import { dataSyncService, SyncState } from '../services/DataSyncService';

interface UseProblemsState {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  syncState: SyncState;
}

interface UseProblemsReturn extends UseProblemsState {
  refreshProblems: () => Promise<void>;
  searchProblems: (query: {
    topo?: string;
    subarea?: string;
    grade?: string;
    location?: { latitude: number; longitude: number; radiusKm?: number };
  }) => Promise<Problem[]>;
  getProblem: (problemId: string) => Promise<Problem | null>;
  clearCache: () => void;
}

export function useProblems(circuitId?: string): UseProblemsReturn {
  const [state, setState] = useState<UseProblemsState>({
    problems: [],
    loading: false,
    error: null,
    syncState: dataSyncService.getSyncState(),
  });

  // Load problems for a specific circuit
  const loadProblems = useCallback(async (id: string, forceRefresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const problems = await dataSyncService.getProblems(id, forceRefresh);
      setState(prev => ({
        ...prev,
        problems,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load problems',
        loading: false,
      }));
    }
  }, []);

  // Refresh problems (force network fetch)
  const refreshProblems = useCallback(async () => {
    if (!circuitId) return;
    await loadProblems(circuitId, true);
  }, [circuitId, loadProblems]);

  // Search problems
  const searchProblems = useCallback(async (query: {
    topo?: string;
    subarea?: string;
    grade?: string;
    location?: { latitude: number; longitude: number; radiusKm?: number };
  }): Promise<Problem[]> => {
    try {
      return await dataSyncService.searchProblems(query);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, []);

  // Get single problem
  const getProblem = useCallback(async (problemId: string): Promise<Problem | null> => {
    try {
      return await dataSyncService.getProblem(problemId);
    } catch (error) {
      console.error('Failed to get problem:', error);
      return null;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    dataSyncService.invalidateCache(circuitId);
    if (circuitId) {
      loadProblems(circuitId);
    }
  }, [circuitId, loadProblems]);

  // Load problems when circuitId changes
  useEffect(() => {
    if (circuitId) {
      loadProblems(circuitId);
    }
  }, [circuitId, loadProblems]);

  // Listen for sync state changes
  useEffect(() => {
    const unsubscribe = dataSyncService.addSyncStateListener((syncState) => {
      setState(prev => ({ ...prev, syncState }));
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    refreshProblems,
    searchProblems,
    getProblem,
    clearCache,
  };
}

// Hook for managing all data statistics
export function useDataStats() {
  const [stats, setStats] = useState<{
    cache: { totalKeys: number; problemCaches: number; individualProblems: number };
    database: { totalProblems: number; problemsByTopo: { topo: string; count: number }[] };
    sync: SyncState;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const dataStats = await dataSyncService.getDataStats();
      setStats(dataStats);
    } catch (error) {
      console.error('Failed to load data stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await dataSyncService.clearAllData();
      await loadStats(); // Refresh stats after clearing
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Listen for sync state changes to update stats
  useEffect(() => {
    const unsubscribe = dataSyncService.addSyncStateListener(() => {
      loadStats();
    });

    return unsubscribe;
  }, [loadStats]);

  return {
    stats,
    loading,
    refreshStats: loadStats,
    clearAllData,
  };
}