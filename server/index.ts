import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.ts';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.ts';
import { predictionsRouter } from './routes/predictions.routes.ts';
import { marketsRouter } from './routes/markets.routes.ts';
import { bookingsRouter } from './routes/bookings.routes.ts';
import { authRouter } from './routes/auth.routes.ts';
import { voiceRouter } from './routes/voice.routes.ts';
import { geocodeRouter } from './routes/geocode.routes.ts';
import { farmerRouter } from './routes/farmer.routes.ts';
import { initializeStore } from './repositories/index.ts';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/farmer', farmerRouter);

if (env.NODE_ENV === 'production') {
  const distPath = path.resolve(import.meta.dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use('/api', notFoundHandler);
app.use(errorHandler);

async function main() {
  await initializeStore();
  app.listen(Number(env.PORT), () => {
    console.log(`HarvestPlanner API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
