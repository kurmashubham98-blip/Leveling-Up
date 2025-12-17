'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { statistics as statsApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useWebSocket } from '@/lib/useWebSocket';
import StatCard from '@/components/StatCard';
import Heatmap from '@/components/Heatmap';
import styles from './statistics.module.css';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });
const ProductivityChart = dynamic(() => import('@/components/ProductivityChart'), { ssr: false });

export default function StatisticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [productivity, setProductivity] = useState<any>(null);
    const [habits, setHabits] = useState<any[]>([]);
    const [streaks, setStreaks] = useState<any>(null);
    const [activityData, setActivityData] = useState<Record<string, number>>({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchAllData();
    }, [router]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [statsRes, prodRes, habitsRes, streaksRes] = await Promise.all([
                statsApi.getOverview(),
                statsApi.getProductivity(30),
                statsApi.getHabits(),
                statsApi.getStreaks(),
            ]);

            setStats(statsRes);
            setProductivity(prodRes);
            setHabits(habitsRes.breakdown || []);
            setStreaks(streaksRes);

            // Convert streak history to activity data format
            const activityMap: Record<string, number> = {};
            streaksRes.history?.forEach((item: any) => {
                activityMap[item.date] = item.actions;
            });
            setActivityData(activityMap);

        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time updates
    const socket = useWebSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('questCompleted', () => {
            fetchAllData();
        });

        socket.on('levelUp', () => {
            fetchAllData();
        });

        return () => {
            socket.off('questCompleted');
            socket.off('levelUp');
        };
    }, [socket]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingText}>Loading Statistics...</div>
            </div>
        );
    }

    const categoryColors: Record<string, string> = {
        strength: 'var(--accent-red)',
        agility: 'var(--accent-green)',
        intelligence: 'var(--accent-blue)',
        vitality: 'var(--accent-purple)',
        luck: 'var(--accent-gold)',
        general: 'var(--accent-cyan)',
    };

    return (
        <div className={styles.container}>
            <ParticleBackground />

            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
                    ← Dashboard
                </button>
                <div className={styles.breadcrumb}>
                    <span className={styles.systemTag}>SYSTEM</span>
                    <span className={styles.separator}>/</span>
                    <span>Statistics</span>
                </div>
                <nav className={styles.nav}>
                    <button className={styles.navLink} onClick={() => router.push('/dashboard')}>Dashboard</button>
                    <button className={styles.navLink} onClick={() => router.push('/statistics')}>Statistics</button>
                    <button className={styles.navLink} onClick={() => router.push('/challenges')}>Challenges</button>
                    <button className={styles.navLink} onClick={() => router.push('/leaderboard')}>Leaderboard</button>
                    <button className={styles.navLink} onClick={() => router.push('/compare')}>Compare</button>
                </nav>
            </header>

            <main className={styles.main}>
                <section className={styles.statsGrid}>
                    <StatCard
                        icon="📊"
                        label="Productivity"
                        value={`${productivity?.productivityPercentage || 0}%`}
                        subtitle="Last 30 days"
                        color="var(--accent-blue)"
                    />
                    <StatCard
                        icon="🔥"
                        label="Current Streak"
                        value={`${streaks?.currentStreak || 0}`}
                        subtitle="days"
                        color="var(--accent-red)"
                    />
                    <StatCard
                        icon="✅"
                        label="Total Quests"
                        value={stats?.statistics?.total_quests_completed || 0}
                        subtitle="completed"
                        color="var(--accent-green)"
                    />
                    <StatCard
                        icon="⭐"
                        label="Total XP"
                        value={stats?.statistics?.total_xp_earned || 0}
                        subtitle="earned"
                        color="var(--accent-cyan)"
                    />
                </section>

                <section className={styles.chartsSection}>
                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Productivity Overview</h3>
                        <div className={styles.chartWrapper}>
                            <ProductivityChart percentage={productivity?.productivityPercentage || 0} size={220} />
                            <div className={styles.chartStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Completed</span>
                                    <span className={styles.statValue}>{productivity?.totalCompleted || 0}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Target</span>
                                    <span className={styles.statValue}>{productivity?.totalExpected || 0}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Avg/Day</span>
                                    <span className={styles.statValue}>
                                        {stats?.statistics?.average_daily_quests || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Habit Breakdown</h3>
                        <div className={styles.habitsList}>
                            {habits.length > 0 ? (
                                habits.map((habit: any) => (
                                    <div key={habit.category} className={styles.habitItem}>
                                        <div className={styles.habitInfo}>
                                            <span className={styles.habitName}>
                                                {habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}
                                            </span>
                                            <span className={styles.habitCount}>{habit.count} quests</span>
                                        </div>
                                        <div className={styles.habitBar}>
                                            <div
                                                className={styles.habitBarFill}
                                                style={{
                                                    width: `${(habit.count / Math.max(...habits.map((h: any) => h.count))) * 100}%`,
                                                    background: categoryColors[habit.category] || 'var(--accent-blue)',
                                                }}
                                            />
                                        </div>
                                        <span className={styles.habitXp}>+{habit.total_xp} XP</span>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>No habit data yet</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className={styles.heatmapSection}>
                    <div className={styles.heatmapCard}>
                        <h3 className={styles.cardTitle}>Activity Heatmap</h3>
                        <p className={styles.cardSubtitle}>
                            Longest Streak: <strong>{streaks?.longestStreak || 0} days</strong>
                        </p>
                        <Heatmap data={activityData} />
                    </div>
                </section>
            </main>
        </div>
    );
}
