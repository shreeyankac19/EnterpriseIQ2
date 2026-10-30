import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, UPLOADS_DIR } from './db.js';
import authRoutes from './routes/auth.js';
import docRoutes from './routes/docs.js';
import projectRoutes from './routes/projects.js';
import chatRoutes from './routes/chat.js';
import searchRoutes from './routes/search.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded documents
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// System status / health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EnterpriseIQ',
    engine: 'SQLite Knowledge Graph + RAG Vector Indices',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if available
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing EnterpriseIQ SQLite Database and vector indices...');
    await initDatabase();
    console.log('Database successfully initialized.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EnterpriseIQ API Server running on port ${PORT} (0.0.0.0)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
