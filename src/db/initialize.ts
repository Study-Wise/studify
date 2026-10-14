import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(import.meta.env?.DATABASE_URL || process.env.DATABASE_URL!);

const db = drizzle({ client: sql });

export { db };