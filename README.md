# ARISE - Solo Leveling Habit Tracker

A gamified habit-tracking application inspired by Solo Leveling's "System". Turn your self-improvement journey into an RPG adventure!

## Features

- **Player Progression**: Level up from E-Rank to Monarch
- **Stats System**: STR, AGI, INT, VIT, LCK - allocate points as you level
- **Quest System**: Daily, Weekly, and Side quests with XP/Gold rewards
- **Dungeon Challenges**: Timed challenges with bonus rewards
- **Dark Cyberpunk UI**: Glowing "System" aesthetic

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Zustand
- **Backend**: Node.js, Express
- **Database**: MySQL/TiDB
- **Auth**: JWT

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+ (or TiDB Cloud)

### Database Setup

1. Create a MySQL database
2. Run the schema:
```bash
mysql -u root -p < backend/database/schema.sql
```

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

App runs on `http://localhost:3000`

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Player
- `GET /api/player/profile` - Get player stats
- `PUT /api/player/stats` - Allocate stat points
- `GET /api/player/inventory` - Get inventory
- `GET /api/player/shop` - Get shop items
- `POST /api/player/shop/:itemId` - Buy item

### Quests
- `GET /api/quests` - Get all quests
- `POST /api/quests` - Create quest
- `PUT /api/quests/:id/progress` - Update progress
- `POST /api/quests/:id/complete` - Complete quest
- `DELETE /api/quests/:id` - Delete quest

### Dungeons
- `GET /api/dungeons` - Get available dungeons
- `GET /api/dungeons/active` - Get active dungeon
- `POST /api/dungeons/:id/start` - Start dungeon
- `POST /api/dungeons/complete` - Complete dungeon

## License

MIT

