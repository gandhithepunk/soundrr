const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const lidarr = require('../services/lidarr');
const { getDb } = require('../db/database');

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

// Image proxy — fetches cover art from Lidarr and passes it to the browser
router.get('/image-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const db = getDb();
    const lidarrUrl = db.prepare("SELECT value FROM settings WHERE key = 'lidarr_url'").get()?.value;
    const apiKey = db.prepare("SELECT value FROM settings WHERE key = 'lidarr_api_key'").get()?.value;

    // Only proxy requests to the configured Lidarr server
    if (lidarrUrl && !url.startsWith(lidarrUrl)) {
      return res.status(403).json({ error: 'URL not allowed' });
    }

    const response = await axios.get(url, {
      headers: { 'X-Api-Key': apiKey },
      responseType: 'stream',
      timeout: 10000,
    });

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
