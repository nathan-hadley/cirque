import { MMKV } from 'react-native-mmkv';
import { Problem, ProblemSchema } from '../models/problems';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

class CacheService {
  private storage: MMKV;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.storage = new MMKV({
      id: 'cirque-cache',
      encryptionKey: 'cirque-cache-encryption-key',
    });
  }

  // Generic cache methods
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.storage.set(key, JSON.stringify(entry));
  }

  get<T>(key: string): T | null {
    const rawData = this.storage.getString(key);
    if (!rawData) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(rawData);
      
      // Check if cache entry has expired
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Failed to parse cached data:', error);
      this.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clearAll();
  }

  // Problem-specific cache methods
  cacheProblems(circuitId: string, problems: Problem[]): void {
    // Validate problems before caching
    const validatedProblems = problems.filter(problem => {
      try {
        ProblemSchema.parse(problem);
        return true;
      } catch (error) {
        console.warn('Invalid problem data, skipping cache:', error);
        return false;
      }
    });

    this.set(`problems_${circuitId}`, validatedProblems, 30 * 60 * 1000); // 30 minutes TTL
  }

  getCachedProblems(circuitId: string): Problem[] | null {
    const problems = this.get<Problem[]>(`problems_${circuitId}`);
    if (!problems) return null;

    // Validate cached problems
    return problems.filter(problem => {
      try {
        ProblemSchema.parse(problem);
        return true;
      } catch (error) {
        console.warn('Invalid cached problem data:', error);
        return false;
      }
    });
  }

  cacheProblem(problem: Problem): void {
    try {
      const validatedProblem = ProblemSchema.parse(problem);
      this.set(`problem_${problem.id}`, validatedProblem, 60 * 60 * 1000); // 1 hour TTL
    } catch (error) {
      console.error('Failed to cache problem - validation failed:', error);
    }
  }

  getCachedProblem(problemId: string): Problem | null {
    const problem = this.get<Problem>(`problem_${problemId}`);
    if (!problem) return null;

    try {
      return ProblemSchema.parse(problem);
    } catch (error) {
      console.warn('Invalid cached problem data:', error);
      this.delete(`problem_${problemId}`);
      return null;
    }
  }

  // Cache invalidation methods
  invalidateProblemsCache(circuitId?: string): void {
    if (circuitId) {
      this.delete(`problems_${circuitId}`);
    } else {
      // Invalidate all problem caches
      const keys = this.getAllKeys();
      keys
        .filter(key => key.startsWith('problems_'))
        .forEach(key => this.delete(key));
    }
  }

  invalidateProblemCache(problemId: string): void {
    this.delete(`problem_${problemId}`);
  }

  // Utility methods
  private getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  getCacheStats(): { totalKeys: number; problemCaches: number; individualProblems: number } {
    const keys = this.getAllKeys();
    return {
      totalKeys: keys.length,
      problemCaches: keys.filter(key => key.startsWith('problems_')).length,
      individualProblems: keys.filter(key => key.startsWith('problem_')).length,
    };
  }

  // Check if data is stale without removing it
  isStale(key: string): boolean {
    const rawData = this.storage.getString(key);
    if (!rawData) return true;

    try {
      const entry: CacheEntry<unknown> = JSON.parse(rawData);
      return entry.ttl ? Date.now() - entry.timestamp > entry.ttl : false;
    } catch {
      return true;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;