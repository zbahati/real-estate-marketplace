require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const listingsRouter = require('./routes/listings');
const favoritesRouter = require('./routes/favorites');
const imagesRouter = require('./routes/images');
const requestRoutes = require('./routes/requests');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

app.use('/auth', authRouter);
app.use('/listings', listingsRouter);
app.use('/favorites', favoritesRouter);
app.use('/images', imagesRouter);
app.use('/requests', requestRoutes);
app.use('/payments', paymentRoutes);

app.use('/health', healthRouter);

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MAX_PORT_RETRIES = process.env.PORT_RETRIES ? Number(process.env.PORT_RETRIES) : 5;

async function startServer(port = DEFAULT_PORT, retries = MAX_PORT_RETRIES) {
  try {
    // Optional: run migrations at startup if enabled
    if (process.env.RUN_MIGRATIONS === 'true') {
      console.log('Running migrations before startup...');
      await db.migrate();
    }

    await db.testConnection();

    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    server.on('error', async (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use.`);
        if (retries > 0) {
          const nextPort = port + 1;
          console.log(`Trying next port ${nextPort} (retries left: ${retries - 1})`);
          setTimeout(() => startServer(nextPort, retries - 1), 200);
        } else {
          console.error('No available ports; exiting.');
          await db.shutdown();
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
        await db.shutdown();
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        try {
          await db.shutdown();
          console.log('DB pool closed.');
          process.exit(0);
        } catch (e) {
          console.error('Error during shutdown:', e);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    await db.shutdown();
    process.exit(1);
  }
}

startServer();
