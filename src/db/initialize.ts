import "dotenv/config";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.DATABASE_URL || process.env.DATABASE_URL!);

const db = drizzle({ client: sql });

export { db };