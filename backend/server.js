const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const healthRoutes = require('./routes/health');
const repoRoutes = require('./routes/repo');
const infoRoutes = require('./routes/info');
const retrievalRoutes = require('./routes/retrieval');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');
const authRoutes = require('./routes/authRoutes');
const { seedAdmin } = require('./services/authService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(','),
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', repoRoutes);
app.use('/api', infoRoutes);
app.use('/api', retrievalRoutes);
app.use('/api', chatRoutes);
app.use('/api', searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);

  // Admin seed disabled for production stability
  // try {
  //   await seedAdmin();
  // } catch (err) {
  //   logger.error(`Admin seed failed: ${err.message}`);
  // }
});

module.exports = app;
