import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool;

if (process.env.DATABASE_URL) {
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else if (process.env.NODE_ENV === "development") {
  // Lightweight mock Pool for development when no DATABASE_URL is provided.
  // This avoids introducing heavy dependencies or requiring Docker while
  // allowing the server to run and routes that don't touch the DB to work.
  class MockPool {
    query(_sql: string, _params?: any[]) {
      return Promise.resolve({ rows: [], rowCount: 0, command: "" });
    }
    connect() {
      return Promise.resolve({
        release: () => {},
        query: (sql: string, params?: any[]) => this.query(sql, params),
      });
    }
    end() {
      return Promise.resolve();
    }
  }
  // @ts-expect-error treat MockPool as pg.Pool at runtime
  _pool = new MockPool();
} else {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = _pool;
export const db = drizzle(pool, { schema });

export * from "./schema";
