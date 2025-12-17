const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Register new player
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user exists
    const [existing] = await pool.query(
      'SELECT id FROM players WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create player
    const [result] = await pool.query(
      'INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const playerId = result.insertId;

    // Initialize player stats
    await pool.query(
      'INSERT INTO player_stats (player_id) VALUES (?)',
      [playerId]
    );

    // Generate token
    const token = jwt.sign(
      { id: playerId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Player created successfully',
      token,
      player: { id: playerId, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login player
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [players] = await pool.query(
      'SELECT * FROM players WHERE email = ?',
      [email]
    );

    if (players.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const player = players[0];
    const validPassword = await bcrypt.compare(password, player.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE players SET last_login = CURDATE() WHERE id = ?', [player.id]);

    const token = jwt.sign(
      { id: player.id, username: player.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      player: {
        id: player.id,
        username: player.username,
        email: player.email,
        level: player.level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

