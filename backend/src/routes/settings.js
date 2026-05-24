const express = require('express');
const { getDb } = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');
const lidarr = require('../services/lidarr');
const plex = require('../services/plex');

const router = express.Router();

const PUBLIC_KEYS = ['allow_registration'];
const SETTINGS_KEYS = [
  'lidarr_url', 'lidarr_api_key',
  'plex_url', 'plex_token',
  'auto_approve', 'allow_registration',
  'app_name', 'plex_library_section'
];

router.get('/', auth, adminOnly, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.get('/public', (req, res) => {
  const db = getDb();
  const settings = {};
  for (const key of PUBLIC_KEYS) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    settings[key] = row?.value;
  }
  res.json(settings);
});

router.post('/', auth, adminOnly, (req, res) => {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updates = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      if (SETTINGS_KEYS.includes(key)) {
        upsert.run(key, value);
      }
    }
  });
  updates(req.body);
  res.json({ success: true });
});

router.post('/test/lidarr', auth, adminOnly, async (req, res) => {
  const { url, api_key } = req.body;
  try {
    const status = await lidarr.testConnection(url, api_key);
    res.json({ success: true, version: status.version });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/test/plex', auth, adminOnly, async (req, res) => {
  const { url, token } = req.body;
  try {
    const status = await plex.testConnection(url, token);
    res.json({ success: true, friendlyName: status?.friendlyName });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/lidarr/profiles', auth, adminOnly, async (req, res) => {
  try {
    const [quality, metadata, rootFolders] = await Promise.all([
      lidarr.getQualityProfiles(),
      lidarr.getMetadataProfiles(),
      lidarr.getRootFolders(),
    ]);
    res.json({ quality, metadata, rootFolders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
