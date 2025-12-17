import styles from './ChallengeCard.module.css';

interface Challenge {
    id: number;
    name: string;
    description: string;
    challenge_type: string;
    difficulty: string;
    duration_days: number;
    max_participants: number;
    xp_reward: number;
    gold_reward: number;
    target_count: number;
    current_progress?: number;
    participant_count: number;
    status?: string;
    participation_status?: string;
}

interface ChallengeCardProps {
    challenge: Challenge;
    onJoin?: (id: number) => void;
    onView?: (id: number) => void;
    isActive?: boolean;
}

export default function ChallengeCard({ challenge, onJoin, onView, isActive = false }: ChallengeCardProps) {
    const difficultyColors: Record<string, string> = {
        easy: 'var(--accent-green)',
        medium: 'var(--accent-blue)',
        hard: 'var(--accent-purple)',
        nightmare: 'var(--accent-red)',
    };

    const progress = isActive && challenge.current_progress !== undefined
        ? (challenge.current_progress / challenge.target_count) * 100
        : 0;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.icon}>🎯</div>
                <div className={styles.info}>
                    <h3 className={styles.title}>{challenge.name}</h3>
                    <p className={styles.description}>{challenge.description}</p>
                </div>
            </div>

            <div className={styles.meta}>
                <span
                    className={styles.badge}
                    style={{ background: `${difficultyColors[challenge.difficulty]}20`, color: difficultyColors[challenge.difficulty] }}
                >
                    {challenge.difficulty.toUpperCase()}
                </span>
                <span className={styles.type}>{challenge.challenge_type}</span>
                <span className={styles.duration}>{challenge.duration_days}d</span>
            </div>

            {isActive && (
                <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%`, background: difficultyColors[challenge.difficulty] }}
                        />
                    </div>
                    <div className={styles.progressText}>
                        {challenge.current_progress}/{challenge.target_count}
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.participants}>
                    👥 {challenge.participant_count}/{challenge.max_participants}
                </div>
                <div className={styles.rewards}>
                    <span className={styles.xp}>+{challenge.xp_reward} XP</span>
                    <span className={styles.gold}>+{challenge.gold_reward} 🪙</span>
                </div>
            </div>

            <div className={styles.actions}>
                {isActive ? (
                    <button className={`btn btn-secondary ${styles.btn}`} onClick={() => onView?.(challenge.id)}>
                        View Details
                    </button>
                ) : (
                    <button className={`btn btn-primary ${styles.btn}`} onClick={() => onJoin?.(challenge.id)}>
                        Join Challenge
                    </button>
                )}
            </div>
        </div>
    );
}
