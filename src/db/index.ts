import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Get the database URL from environment
 * In Vite, use VITE_ prefix for client-side env vars
 */
function getDatabaseUrl(): string {
	const url = import.meta.env.VITE_DATABASE_URL;
	if (!url) {
		throw new Error(
			'DATABASE_URL is not set. Please add it to your .env file.',
		);
	}
	return url;
}

/**
 * Create a database connection
 * Uses Neon's serverless driver for edge-compatible connections
 */
export function createDb() {
	const sql = neon(getDatabaseUrl());
	return drizzle(sql, { schema });
}

/**
 * Singleton database instance for client-side usage
 * Lazy initialization to avoid errors when env vars aren't available
 */
let dbInstance: ReturnType<typeof createDb> | null = null;

export function getDb() {
	if (!dbInstance) {
		dbInstance = createDb();
	}
	return dbInstance;
}

// Re-export schema for convenience
export * from './schema';
