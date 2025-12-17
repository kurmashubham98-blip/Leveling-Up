const jwt = require('jsonwebtoken');

module.exports = (io) => {
    // Middleware to authenticate WebSocket connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.username = decoded.username;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WebSocket] User connected: ${socket.username} (ID: ${socket.userId})`);

        // Join player-specific room
        socket.join(`player:${socket.userId}`);

        // Subscribe to leaderboard updates
        socket.on('subscribe:leaderboard', () => {
            socket.join('leaderboard');
            console.log(`[WebSocket] ${socket.username} subscribed to leaderboard`);
        });

        // Unsubscribe from leaderboard
        socket.on('unsubscribe:leaderboard', () => {
            socket.leave('leaderboard');
            console.log(`[WebSocket] ${socket.username} unsubscribed from leaderboard`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`[WebSocket] User disconnected: ${socket.username}`);
        });
    });

    // Broadcast helper functions
    const broadcast = {
        // Quest completed by a player
        questCompleted: (playerId, username, questData) => {
            io.to('leaderboard').emit('quest:completed', {
                playerId,
                username,
                quest: questData,
                timestamp: new Date()
            });
        },

        // Player leveled up
        levelUp: (playerId, username, newLevel, newRank) => {
            io.emit('level:up', {
                playerId,
                username,
                level: newLevel,
                rank: newRank,
                timestamp: new Date()
            });
        },

        // Player rank changed
        rankChanged: (playerId, username, oldRank, newRank) => {
            io.emit('rank:changed', {
                playerId,
                username,
                oldRank,
                newRank,
                timestamp: new Date()
            });
        },

        // Leaderboard positions updated
        leaderboardUpdated: (affectedPlayers) => {
            io.to('leaderboard').emit('leaderboard:updated', {
                affectedPlayers,
                timestamp: new Date()
            });
        },

        // Player joined challenge
        challengeJoined: (playerId, username, challengeId, challengeName) => {
            io.emit('challenge:joined', {
                playerId,
                username,
                challengeId,
                challengeName,
                timestamp: new Date()
            });
        },

        // Player completed challenge
        challengeCompleted: (playerId, username, challengeId, challengeName) => {
            io.emit('challenge:completed', {
                playerId,
                username,
                challengeId,
                challengeName,
                timestamp: new Date()
            });
        }
    };

    // Export broadcast functions to be used by controllers
    global.socketBroadcast = broadcast;

    return io;
};
