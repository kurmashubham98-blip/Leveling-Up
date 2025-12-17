import styles from './StatCard.module.css';

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}

export default function StatCard({ icon, label, value, subtitle, color = 'var(--accent-blue)' }: StatCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.icon} style={{ color }}>
                {icon}
            </div>
            <div className={styles.content}>
                <div className={styles.label}>{label}</div>
                <div className={styles.value}>{value}</div>
                {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
        </div>
    );
}
