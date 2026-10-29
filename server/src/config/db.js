import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name} (MongoDB Compass: ${ENV.MONGODB_URI})`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    // If running in development without live MongoDB instance, warn instead of hard exiting immediately
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
