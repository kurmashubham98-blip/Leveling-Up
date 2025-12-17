'use client';

import styles from './QuestCard.module.css';

interface Quest {
  id: number;
  custom_name: string;
  custom_description: string;
  quest_type: string;
  difficulty: string;
  xp_reward: number;
  gold_reward: number;
  current_progress: number;
  target_count: number;
  status: string;
  stat_type?: string;
}

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

const statIcons: Record<string, { icon: string; class: string }> = {
  strength: { icon: '💪', class: 'iconStrength' },
  agility: { icon: '⚡', class: 'iconAgility' },
  intelligence: { icon: '📚', class: 'iconIntelligence' },
  vitality: { icon: '💧', class: 'iconVitality' },
  luck: { icon: '🍀', class: 'iconLuck' },
};

const difficultyColors: Record<string, string> = {
  easy: '#22c55e',
  medium: '#4a9eff',
  hard: '#f5a623',
  nightmare: '#ef4444',
};

export default function QuestCard({ quest, onComplete, onDelete }: QuestCardProps) {
  const progress = (quest.current_progress / quest.target_count) * 100;
  const isComplete = quest.status === 'completed';
  const statInfo = statIcons[quest.stat_type || ''] || { icon: '⭐', class: 'iconDefault' };

  return (
    <div className={`${styles.card} ${isComplete ? styles.completed : ''}`}>
      <div className={`${styles.iconWrapper} ${styles[statInfo.class]}`}>
        {statInfo.icon}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{quest.custom_name}</h3>
          <span className={styles.tag}>New</span>
        </div>
        
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${progress}%`,
                background: difficultyColors[quest.difficulty]
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.rewards}>
          <span className={styles.xp}>{quest.current_progress}/{quest.target_count}</span>
        </div>

        {!isComplete ? (
          <div className={styles.actions}>
            <button 
              className={styles.completeBtn}
              onClick={() => onComplete(quest.id)}
            >
              Done
            </button>
            <button 
              className={styles.deleteBtn}
              onClick={() => onDelete(quest.id)}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className={styles.completedBadge}>✓</div>
        )}
      </div>
    </div>
  );
}
