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
}

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

const difficultyColors: Record<string, string> = {
  easy: '#00ff88',
  medium: '#00d4ff',
  hard: '#ffd700',
  nightmare: '#ff4757',
};

export default function QuestCard({ quest, onComplete, onDelete }: QuestCardProps) {
  const progress = (quest.current_progress / quest.target_count) * 100;
  const isComplete = quest.status === 'completed';

  return (
    <div className={`${styles.card} ${isComplete ? styles.completed : ''}`}>
      <div className={styles.header}>
        <div className={styles.typeTag}>{quest.quest_type.toUpperCase()}</div>
        <div 
          className={styles.difficulty}
          style={{ color: difficultyColors[quest.difficulty] }}
        >
          {quest.difficulty.toUpperCase()}
        </div>
      </div>

      <h3 className={styles.name}>{quest.custom_name}</h3>
      {quest.custom_description && (
        <p className={styles.description}>{quest.custom_description}</p>
      )}

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
        <span className={styles.progressText}>
          {quest.current_progress}/{quest.target_count}
        </span>
      </div>

      <div className={styles.rewards}>
        <span className={styles.xp}>+{quest.xp_reward} XP</span>
        <span className={styles.gold}>+{quest.gold_reward} 💰</span>
      </div>

      {!isComplete && (
        <div className={styles.actions}>
          <button 
            className={`btn btn-primary ${styles.completeBtn}`}
            onClick={() => onComplete(quest.id)}
          >
            COMPLETE
          </button>
          <button 
            className={styles.deleteBtn}
            onClick={() => onDelete(quest.id)}
          >
            ✕
          </button>
        </div>
      )}

      {isComplete && (
        <div className={styles.completedBadge}>
          ✓ CLEARED
        </div>
      )}
    </div>
  );
}

