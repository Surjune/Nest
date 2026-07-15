import 'dotenv/config';
import { connectDb, disconnectDb } from '../db.js';
import { seedDatabase } from './seedData.js';

// Standalone seeding only makes sense against a persistent database.
// In demo mode (no MONGODB_URI) the server seeds itself on startup.
const { ephemeral } = await connectDb();
if (ephemeral) {
  console.log('No MONGODB_URI set — nothing to seed persistently.');
  console.log('Demo mode seeds automatically when you run `npm run dev`.');
} else {
  await seedDatabase();
}
await disconnectDb();
