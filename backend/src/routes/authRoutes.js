const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Register
router.post('/register', (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash, assignedRole);

    const user = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole
    };

    const token = generateToken(user);
    res.status(201).json({
      message: 'Account registered successfully.',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(safeUser);
    res.json({
      message: 'Logged in successfully.',
      user: safeUser,
      token
    });
  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Demo accounts endpoint for rapid evaluation/testing
router.get('/demo-accounts', (req, res, next) => {
  try {
    const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY id ASC LIMIT 10').all();
    res.json({ accounts: users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
