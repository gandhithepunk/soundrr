const express = require('express');
const { getDb } = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');
const lidarr = require('../services/lidarr');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = getDb();
  let query = `SELECT r.*, u.username FROM requests r JOIN users u ON r.user_id = u.id`;
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' WHERE r.user_id = ?';
    params.push(req.user.id);
  }
  query += ' ORDER BY r.requested_at DESC';
  const requests = db.prepare(query).all(...params);
  res.json(requests);
});

router.post('/', auth, async (req, res) => {
  const { type, artist_name, album_name, artist_mbid, album_mbid, cover_url, lidarr_data } = req.body;
  if (!type || !artist_name) return res.status(400).json({ error: 'Missing required fields' });

  const db = getDb();

  // Check for duplicate
  const existing = db.prepare(
    'SELECT id FROM requests WHERE artist_mbid = ? AND (album_mbid = ? OR (album_mbid IS NULL AND ? IS NULL)) AND status != ?'
  ).get(artist_mbid, album_mbid || null, album_mbid || null, 'rejected');
  if (existing) return res.status(409).json({ error: 'Already requested' });

  const autoApprove = db.prepare("SELECT value FROM settings WHERE key = 'auto_approve'").get()?.value === 'true';
  const status = autoApprove ? 'approved' : 'pending';

  const result = db.prepare(
    'INSERT INTO requests (user_id, type, artist_name, album_name, artist_mbid, album_mbid, cover_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, type, artist_name, album_name || null, artist_mbid || null, album_mbid || null, cover_url || null, status);

  if (autoApprove) {
    try {
      await sendToLidarr(result.lastInsertRowid, type, lidarr_data);
    } catch (err) {
      console.error('Auto-approve Lidarr error:', err.message);
    }
  }

  res.status(201).json({ id: result.lastInsertRowid, status });
});

router.patch('/:id/approve', auth, adminOnly, async (req, res) => {
  const db = getDb();
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  db.prepare("UPDATE requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

  try {
    await sendToLidarr(request.id, request.type, req.body.lidarr_data);
    res.json({ success: true, lidarr: true });
  } catch (err) {
    res.json({ success: true, lidarr: false, error: err.message });
  }
});

router.patch('/:id/reject', auth, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

async function sendToLidarr(requestId, type, lidarrData) {
  const db = getDb();
  try {
    let result;
    if (type === 'artist') {
      result = await lidarr.addArtist(lidarrData);
    } else {
      result = await lidarr.addAlbum(lidarrData);
    }
    db.prepare("UPDATE requests SET lidarr_id = ?, lidarr_status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(result.id, requestId);
    return result;
  } catch (err) {
    db.prepare("UPDATE requests SET lidarr_status = 'error', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(requestId);
    throw err;
  }
}

module.exports = router;
