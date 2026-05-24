const express = require('express');
const { auth } = require('../middleware/auth');
const plex = require('../services/plex');

const router = express.Router();

router.get('/libraries', auth, async (req, res) => {
  try {
    const libs = await plex.getMusicLibraries();
    res.json(libs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/artists', auth, async (req, res) => {
  const { section } = req.query;
  if (!section) return res.status(400).json({ error: 'Section required' });
  try {
    const artists = await plex.getArtists(section);
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', auth, async (req, res) => {
  const { section, limit } = req.query;
  if (!section) return res.status(400).json({ error: 'Section required' });
  try {
    const recent = await plex.getRecentlyAdded(section, parseInt(limit) || 20);
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const results = await plex.searchPlex(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
