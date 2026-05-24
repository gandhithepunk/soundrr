const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const { getDb } = require('./db/database');
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const lidarrRoutes = require('./routes/lidarr');
const plexRoutes = require('./routes/plex');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize DB
getDb();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/lidarr', lidarrRoutes);
app.use('/api/plex', plexRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Serve frontend in production
const frontendPath = path.join(__dirname, '../../frontend/build');
const fs = require('fs');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Cron: sync request statuses every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const lidarr = require('./services/lidarr');
    const db = getDb();
    const pending = db.prepare("SELECT * FROM requests WHERE lidarr_id IS NOT NULL AND status = 'approved'").all();
    if (pending.length === 0) return;
    const queue = await lidarr.getQueue();
    const queueIds = new Set((queue.records || []).map(r => r.artistId));
    for (const req of pending) {
      if (!queueIds.has(req.lidarr_id)) {
        db.prepare("UPDATE requests SET lidarr_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.id);
      }
    }
  } catch { /* silent */ }
});

app.listen(PORT, () => {
  console.log(`🎵 Soundrr backend running on port ${PORT}`);
});
