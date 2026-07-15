import mongoose from 'mongoose';

let memoryServer = null;

// Connects to MONGODB_URI when set (Atlas or local install).
// Otherwise spins up an in-memory MongoDB so the demo needs zero setup —
// data resets on restart, so the server re-seeds itself in that mode.
export async function connectDb() {
  let uri = process.env.MONGODB_URI;
  let ephemeral = false;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('nest');
    ephemeral = true;
    console.log('No MONGODB_URI set — using in-memory MongoDB (demo mode).');
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected (${ephemeral ? 'in-memory' : 'persistent'})`);
  return { ephemeral };
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
