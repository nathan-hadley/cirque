import SQLite from 'react-native-sqlite-storage';
import { Problem, ProblemSchema } from '../models/problems';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

interface DatabaseProblem extends Omit<Problem, 'line' | 'coordinates'> {
  line: string; // JSON string
  coordinates: string; // JSON string
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabase({
        name: 'cirque.db',
        location: 'default',
        createFromLocation: '~cirque.db',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createProblemsTable = `
      CREATE TABLE IF NOT EXISTS problems (
        id TEXT PRIMARY KEY,
        name TEXT,
        grade TEXT,
        "order" INTEGER,
        colorStr TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        line TEXT NOT NULL,
        topo TEXT,
        subarea TEXT,
        coordinates TEXT,
        latitude REAL,
        longitude REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_problems_topo ON problems(topo);',
      'CREATE INDEX IF NOT EXISTS idx_problems_subarea ON problems(subarea);',
      'CREATE INDEX IF NOT EXISTS idx_problems_grade ON problems(grade);',
      'CREATE INDEX IF NOT EXISTS idx_problems_location ON problems(latitude, longitude);',
    ];

    await this.db.executeSql(createProblemsTable);
    
    for (const indexQuery of createIndexes) {
      await this.db.executeSql(indexQuery);
    }
  }

  // Problem CRUD operations
  async saveProblem(problem: Problem): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      // Validate problem data
      const validatedProblem = ProblemSchema.parse(problem);

      const dbProblem: DatabaseProblem = {
        ...validatedProblem,
        line: JSON.stringify(validatedProblem.line),
        coordinates: validatedProblem.coordinates ? JSON.stringify(validatedProblem.coordinates) : '',
        latitude: validatedProblem.coordinates?.[1],
        longitude: validatedProblem.coordinates?.[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const query = `
        INSERT OR REPLACE INTO problems 
        (id, name, grade, "order", colorStr, color, description, line, topo, subarea, coordinates, latitude, longitude, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db!.executeSql(query, [
        dbProblem.id,
        dbProblem.name || null,
        dbProblem.grade || null,
        dbProblem.order || null,
        dbProblem.colorStr,
        dbProblem.color,
        dbProblem.description || null,
        dbProblem.line,
        dbProblem.topo || null,
        dbProblem.subarea || null,
        dbProblem.coordinates,
        dbProblem.latitude || null,
        dbProblem.longitude || null,
        dbProblem.createdAt,
        dbProblem.updatedAt,
      ]);
    } catch (error) {
      console.error('Failed to save problem:', error);
      throw error;
    }
  }

  async saveProblems(problems: Problem[]): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.transaction(async (tx) => {
        for (const problem of problems) {
          try {
            const validatedProblem = ProblemSchema.parse(problem);
            
            const dbProblem: DatabaseProblem = {
              ...validatedProblem,
              line: JSON.stringify(validatedProblem.line),
              coordinates: validatedProblem.coordinates ? JSON.stringify(validatedProblem.coordinates) : '',
              latitude: validatedProblem.coordinates?.[1],
              longitude: validatedProblem.coordinates?.[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const query = `
              INSERT OR REPLACE INTO problems 
              (id, name, grade, "order", colorStr, color, description, line, topo, subarea, coordinates, latitude, longitude, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await tx.executeSql(query, [
              dbProblem.id,
              dbProblem.name || null,
              dbProblem.grade || null,
              dbProblem.order || null,
              dbProblem.colorStr,
              dbProblem.color,
              dbProblem.description || null,
              dbProblem.line,
              dbProblem.topo || null,
              dbProblem.subarea || null,
              dbProblem.coordinates,
              dbProblem.latitude || null,
              dbProblem.longitude || null,
              dbProblem.createdAt,
              dbProblem.updatedAt,
            ]);
          } catch (validationError) {
            console.warn('Skipping invalid problem data:', validationError);
          }
        }
      });
    } catch (error) {
      console.error('Failed to save problems:', error);
      throw error;
    }
  }

  async getProblem(id: string): Promise<Problem | null> {
    if (!this.db) await this.initialize();

    try {
      const [results] = await this.db!.executeSql(
        'SELECT * FROM problems WHERE id = ?',
        [id]
      );

      if (results.rows.length === 0) return null;

      const dbProblem = results.rows.item(0) as DatabaseProblem;
      return this.dbProblemToProblem(dbProblem);
    } catch (error) {
      console.error('Failed to get problem:', error);
      return null;
    }
  }

  async getProblems(filters?: {
    topo?: string;
    subarea?: string;
    grade?: string;
    limit?: number;
    offset?: number;
  }): Promise<Problem[]> {
    if (!this.db) await this.initialize();

    try {
      let query = 'SELECT * FROM problems WHERE 1=1';
      const params: unknown[] = [];

      if (filters?.topo) {
        query += ' AND topo = ?';
        params.push(filters.topo);
      }

      if (filters?.subarea) {
        query += ' AND subarea = ?';
        params.push(filters.subarea);
      }

      if (filters?.grade) {
        query += ' AND grade = ?';
        params.push(filters.grade);
      }

      query += ' ORDER BY "order", name';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);

        if (filters?.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const [results] = await this.db!.executeSql(query, params);
      const problems: Problem[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const dbProblem = results.rows.item(i) as DatabaseProblem;
        const problem = this.dbProblemToProblem(dbProblem);
        if (problem) problems.push(problem);
      }

      return problems;
    } catch (error) {
      console.error('Failed to get problems:', error);
      return [];
    }
  }

  async getProblemsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Problem[]> {
    if (!this.db) await this.initialize();

    try {
      // Using simple distance calculation (for more precision, consider using PostGIS-style functions)
      const query = `
        SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
        FROM problems 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        HAVING distance < ?
        ORDER BY distance
      `;

      const [results] = await this.db!.executeSql(query, [
        latitude,
        longitude,
        latitude,
        radiusKm,
      ]);

      const problems: Problem[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const dbProblem = results.rows.item(i) as DatabaseProblem;
        const problem = this.dbProblemToProblem(dbProblem);
        if (problem) problems.push(problem);
      }

      return problems;
    } catch (error) {
      console.error('Failed to get problems near location:', error);
      return [];
    }
  }

  async deleteProblem(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.executeSql('DELETE FROM problems WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete problem:', error);
      throw error;
    }
  }

  async clearProblems(): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.executeSql('DELETE FROM problems');
    } catch (error) {
      console.error('Failed to clear problems:', error);
      throw error;
    }
  }

  // Utility methods
  private dbProblemToProblem(dbProblem: DatabaseProblem): Problem | null {
    try {
      const problem: Problem = {
        id: dbProblem.id,
        name: dbProblem.name || undefined,
        grade: dbProblem.grade || undefined,
        order: dbProblem.order || undefined,
        colorStr: dbProblem.colorStr,
        color: dbProblem.color,
        description: dbProblem.description || undefined,
        line: JSON.parse(dbProblem.line),
        topo: dbProblem.topo || undefined,
        subarea: dbProblem.subarea || undefined,
        coordinates: dbProblem.coordinates ? JSON.parse(dbProblem.coordinates) : undefined,
      };

      // Validate the converted problem
      return ProblemSchema.parse(problem);
    } catch (error) {
      console.warn('Failed to convert database problem to Problem:', error);
      return null;
    }
  }

  async getStats(): Promise<{
    totalProblems: number;
    problemsByTopo: { topo: string; count: number }[];
    problemsByGrade: { grade: string; count: number }[];
  }> {
    if (!this.db) await this.initialize();

    try {
      const [totalResults] = await this.db!.executeSql('SELECT COUNT(*) as count FROM problems');
      const totalProblems = totalResults.rows.item(0).count;

      const [topoResults] = await this.db!.executeSql(`
        SELECT topo, COUNT(*) as count 
        FROM problems 
        WHERE topo IS NOT NULL 
        GROUP BY topo 
        ORDER BY count DESC
      `);

      const [gradeResults] = await this.db!.executeSql(`
        SELECT grade, COUNT(*) as count 
        FROM problems 
        WHERE grade IS NOT NULL 
        GROUP BY grade 
        ORDER BY count DESC
      `);

      const problemsByTopo = [];
      for (let i = 0; i < topoResults.rows.length; i++) {
        problemsByTopo.push(topoResults.rows.item(i));
      }

      const problemsByGrade = [];
      for (let i = 0; i < gradeResults.rows.length; i++) {
        problemsByGrade.push(gradeResults.rows.item(i));
      }

      return {
        totalProblems,
        problemsByTopo,
        problemsByGrade,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalProblems: 0,
        problemsByTopo: [],
        problemsByGrade: [],
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;