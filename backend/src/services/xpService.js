// XP and Leveling Service

const XP_BASE = 100;
const XP_MULTIPLIER = 1.5;

const DIFFICULTY_XP = {
  easy: 1,
  medium: 1.5,
  hard: 2.5,
  nightmare: 4
};

// Calculate XP needed for a specific level
function xpForLevel(level) {
  return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

// Calculate total XP needed from level 1 to target level
function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// Get rank based on level
function getRankId(level) {
  if (level >= 200) return 8; // Monarch
  if (level >= 150) return 7; // National Level
  if (level >= 100) return 6; // S-Rank
  if (level >= 80) return 5;  // A-Rank
  if (level >= 50) return 4;  // B-Rank
  if (level >= 25) return 3;  // C-Rank
  if (level >= 10) return 2;  // D-Rank
  return 1; // E-Rank
}

// Calculate quest XP based on difficulty
function calculateQuestXp(baseXp, difficulty) {
  return Math.floor(baseXp * (DIFFICULTY_XP[difficulty] || 1));
}

// Process level up and return new stats
function processLevelUp(currentLevel, currentXp, xpToNext) {
  let level = currentLevel;
  let xp = currentXp;
  let xpNeeded = xpToNext;
  let statPointsGained = 0;

  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    statPointsGained += 5; // 5 stat points per level
    xpNeeded = xpForLevel(level);
  }

  return {
    level,
    currentXp: xp,
    xpToNextLevel: xpNeeded,
    rankId: getRankId(level),
    statPointsGained
  };
}

module.exports = {
  xpForLevel,
  totalXpForLevel,
  getRankId,
  calculateQuestXp,
  processLevelUp,
  DIFFICULTY_XP
};

