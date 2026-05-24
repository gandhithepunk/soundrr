const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { auth, adminOnly, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const db = getDb();
  const allowReg = db.prepare("SELECT value FROM settings WHERE key = 'allow_registration'").get()?.value;
  if (allowReg === 'false') return res.status(403).json({ error: 'Registration is disabled' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) return res.status(409).json({ error: 'Username or email already taken' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(username, email, hash, 'user');
  const token = jwt.sign({ id: result.lastInsertRowid, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email, role: 'user' } });
});

router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

router.get('/users', auth, adminOnly, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
  res.json(users);
});

router.patch('/users/:id/role', auth, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
  res.json({ success: true });
});

router.delete('/users/:id', auth, adminOnly, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
