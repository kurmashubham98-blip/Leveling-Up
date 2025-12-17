import styles from './RankBadge.module.css';

interface RankBadgeProps {
    rank: string;
    color?: string;
    size?: 'small' | 'medium' | 'large';
}

export default function RankBadge({ rank, color, size = 'medium' }: RankBadgeProps) {
    const rankColors: Record<string, string> = {
        'E': '#808080',
        'D': '#22c55e',
        'C': '#4a9eff',
        'B': '#a855f7',
        'A': '#f5a623',
        'S': '#ef4444',
    };

    const badgeColor = color || rankColors[rank] || '#808080';

    return (
        <span
            className={`${styles.badge} ${styles[size]}`}
            style={{
                borderColor: badgeColor,
                color: badgeColor,
                boxShadow: `0 0 10px ${badgeColor}40`
            }}
        >
            {rank}
        </span>
    );
}
