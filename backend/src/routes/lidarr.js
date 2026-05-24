const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const lidarr = require('../services/lidarr');

const router = express.Router();

router.get('/artist', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const results = await lidarr.searchArtist(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/album', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const results = await lidarr.searchAlbum(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/queue', auth, async (req, res) => {
  try {
    const queue = await lidarr.getQueue();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/artists', auth, async (req, res) => {
  try {
    const artists = await lidarr.getArtists();
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/albums', auth, async (req, res) => {
  try {
    const albums = await lidarr.getAlbums(req.query.artistId);
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
