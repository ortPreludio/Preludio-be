// src/config/db.js
import mongoose from 'mongoose';

export async function conectarDB() {
  const uri = process.env.MONGODB_URI; // sin /DB al final (solo el cluster)
  if (!uri) throw new Error('MONGODB_URI no está definido');

  // APP_ENV: 'production' o 'staging' (default)
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'staging';

  // Permite override por flag: node src/index.js --db=Production
  const flagDb = process.argv.find(a => a.startsWith('--db='))?.split('=')[1];

  // Nombres configurables por .env
  const dbName =
    flagDb ||
    (appEnv === 'production' ? process.env.DB_NAME_PROD : process.env.DB_NAME_STAGING) ||
    'staging';

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName });

  console.log(`[DB] conectado a "${dbName}" (env=${appEnv})`);
}
export default conectarDB