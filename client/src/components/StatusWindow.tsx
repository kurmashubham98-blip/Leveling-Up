'use client';

import styles from './StatusWindow.module.css';

interface PlayerStats {
  username: string;
  level: number;
  rank_name: string;
  rank_color: string;
  current_xp: number;
  xp_to_next_level: number;
  gold: number;
  stat_points: number;
  streak_days: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
}

interface StatusWindowProps {
  player: PlayerStats;
  onAllocateStat?: (stat: string) => void;
}

export default function StatusWindow({ player, onAllocateStat }: StatusWindowProps) {
  const xpPercent = (player.current_xp / player.xp_to_next_level) * 100;

  const stats = [
    { key: 'strength', label: 'STR', value: player.strength, color: '#ff4757' },
    { key: 'agility', label: 'AGI', value: player.agility, color: '#00ff88' },
    { key: 'intelligence', label: 'INT', value: player.intelligence, color: '#00d4ff' },
    { key: 'vitality', label: 'VIT', value: player.vitality, color: '#ffd700' },
    { key: 'luck', label: 'LCK', value: player.luck, color: '#8b5cf6' },
  ];

  return (
    <div className={styles.statusWindow}>
      <div className={styles.header}>
        <div className={styles.systemTag}>[ SYSTEM ]</div>
        <h2 className={styles.title}>STATUS WINDOW</h2>
      </div>

      <div className={styles.playerInfo}>
        <div className={styles.avatar}>
          <div className={styles.avatarGlow}></div>
          <span className={styles.avatarText}>{player.username[0].toUpperCase()}</span>
        </div>
        
        <div className={styles.nameSection}>
          <h3 className={styles.playerName}>{player.username}</h3>
          <div 
            className={styles.rank}
            style={{ color: player.rank_color, borderColor: player.rank_color }}
          >
            {player.rank_name}
          </div>
        </div>
      </div>

      <div className={styles.levelSection}>
        <div className={styles.levelHeader}>
          <span className={styles.levelLabel}>LEVEL</span>
          <span className={styles.levelValue}>{player.level}</span>
        </div>
        <div className={styles.xpBar}>
          <div 
            className={styles.xpFill} 
            style={{ width: `${xpPercent}%` }}
          ></div>
        </div>
        <div className={styles.xpText}>
          {player.current_xp} / {player.xp_to_next_level} XP
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.key} className={styles.statItem}>
            <div className={styles.statLabel} style={{ color: stat.color }}>
              {stat.label}
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            {player.stat_points > 0 && onAllocateStat && (
              <button 
                className={styles.statBtn}
                onClick={() => onAllocateStat(stat.key)}
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>

      {player.stat_points > 0 && (
        <div className={styles.statPoints}>
          <span className={styles.pointsLabel}>Available Points:</span>
          <span className={styles.pointsValue}>{player.stat_points}</span>
        </div>
      )}

      <div className={styles.resources}>
        <div className={styles.resource}>
          <span className={styles.goldIcon}>💰</span>
          <span className={styles.goldValue}>{player.gold}</span>
        </div>
        <div className={styles.resource}>
          <span className={styles.streakIcon}>🔥</span>
          <span className={styles.streakValue}>{player.streak_days} days</span>
        </div>
      </div>
    </div>
  );
}

