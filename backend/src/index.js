const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const questRoutes = require('./routes/quest');
const dungeonRoutes = require('./routes/dungeon');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://leveling-up.vercel.app', /\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/dungeons', dungeonRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ARISE System Online', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`[SYSTEM] ARISE Server running on port ${PORT}`);
});

