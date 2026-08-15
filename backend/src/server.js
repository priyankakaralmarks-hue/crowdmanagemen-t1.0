require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const voteRoutes = require('./routes/voteRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const seedDatabase = require('./seed/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Crowd-Sourced Resource Allocation API'
  });
});

// Serve frontend static build if present
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('API Server is running. Frontend build not yet generated.');
    }
  });
});

// Centralized error handler
app.use(errorHandler);

async function startServer() {
  try {
    await db.init();
    console.log('✅ SQLite Database connected and initialized.');

    // Auto-seed if users table is empty
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();
    if (!userCount || userCount.count === 0) {
      console.log('⚡ Empty database detected. Populating initial seed data...');
      await seedDatabase();
    }

    const serverInstance = app.listen(PORT, () => {
      console.log(`🚀 Resource Allocation API Server running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
    });

    return serverInstance;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
