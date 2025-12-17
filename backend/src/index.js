const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/player');
const questRoutes = require('./routes/quest');
const dungeonRoutes = require('./routes/dungeon');
const statisticsRoutes = require('./routes/statistics');
const challengeRoutes = require('./routes/challenge');
const leaderboardRoutes = require('./routes/leaderboard');
const comparisonRoutes = require('./routes/comparison');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://leveling-nine.vercel.app', /\.vercel\.app$/],
    credentials: true
  }
});

// Initialize WebSocket handlers
require('./websocket')(io);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://leveling-nine.vercel.app', /\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/dungeons', dungeonRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comparison', comparisonRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ARISE System Online', timestamp: new Date() });
});

server.listen(PORT, () => {
  console.log(`[SYSTEM] ARISE Server running on port ${PORT}`);
  console.log(`[WebSocket] Socket.IO server ready`);
});

