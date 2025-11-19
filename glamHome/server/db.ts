import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as logger from "./logger";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with production-ready settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections (Neon serverless recommended limit)
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds if connection fails
});

// Add error handler for pool
pool.on('error', (err, client) => {
  logger.error('Unexpected database pool error', {
    error: err.message,
    stack: err.stack,
  });
});

// Add connection handler for monitoring
pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

// Add remove handler for monitoring
pool.on('remove', (client) => {
  logger.debug('Database connection removed from pool');
});

export const db = drizzle({ client: pool, schema });
