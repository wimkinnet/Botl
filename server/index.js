import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import api from './routes/api.js';

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/botl';
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Render health check, outside the password
  app.get('/healthz', (req, res) => res.json({ ok: mongoose.connection.readyState === 1 }));

  // Botl is a personal collection: one password, asked by the browser, guards everything when APP_PASSWORD is set.
  if (APP_PASSWORD) {
    const want = crypto.createHash('sha256').update(APP_PASSWORD).digest();
    app.use((req, res, next) => {
      const [scheme, value] = (req.headers.authorization || '').split(' ');
      const pass = scheme === 'Basic' && value ? Buffer.from(value, 'base64').toString().split(':').slice(1).join(':') : '';
      const got = crypto.createHash('sha256').update(pass).digest();
      if (crypto.timingSafeEqual(want, got)) return next();
      res.set('WWW-Authenticate', 'Basic realm="Botl", charset="UTF-8"').status(401).send('Password needed');
    });
  }

  app.use('/api', express.json({ limit: '200kb' }), api);

  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  return app;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await mongoose.syncIndexes();
  const app = createApp();
  app.listen(PORT, () => console.log(`Botl listening on :${PORT}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Could not start Botl:', err.message);
    process.exit(1);
  });
}
