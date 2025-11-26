import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder/placeholder');

export default sql;
