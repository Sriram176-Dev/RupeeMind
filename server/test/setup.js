import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { ENV } from '../src/config/env.js';

beforeAll(async () => {
  // Ensure we're using the test database
  if (ENV.NODE_ENV !== 'test') {
    throw new Error('Tests must run with NODE_ENV=test to avoid hitting development database');
  }

  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }
});

afterAll(async () => {
  // Drop all collections from test database
  if (mongoose.connection.readyState !== 0) {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
    await mongoose.disconnect();
  }
});
