import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  if (process.env.SKIP_DB === '1' || !process.env.MONGO_URI) {
    console.warn('Starting server WITHOUT database connection (SKIP_DB or MONGO_URI missing).');
  } else {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection failed. Server will continue without DB.', err.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION!', err);
  process.exit(1);
});