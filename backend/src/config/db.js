import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'ems';

  if (!uri) {
    throw new Error(
      'MONGODB_URI is required. Set MONGODB_URI in backend/.env and point it to the ems database, for example: mongodb+srv://<user>:<pass>@cluster.mongodb.net/ems?retryWrites=true&w=majority or mongodb://127.0.0.1:27017/ems'
    );
  }

  mongoose.set('strictQuery', true);

  // Connect with an explicit dbName option as an extra safeguard
  await mongoose.connect(uri, { dbName });

  mongoose.connection.once('open', () => {
    console.log(`MongoDB connected successfully to database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
};
