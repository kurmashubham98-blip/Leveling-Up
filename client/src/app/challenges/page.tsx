'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { challenges as challengesApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import ChallengeCard from '@/components/ChallengeCard';
import styles from './challenges.module.css';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });

export default function ChallengesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
    const [availableChallenges, setAvailableChallenges] = useState<any[]>([]);
    const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchChallenges();
    }, [router]);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const [available, active, completed] = await Promise.all([
                challengesApi.getAvailable(),
                challengesApi.getActive(),
                challengesApi.getCompleted(),
            ]);

            setAvailableChallenges(available.challenges || []);
            setActiveChallenges(active.challenges || []);
            setCompletedChallenges(completed.challenges || []);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinChallenge = async (id: number) => {
        try {
            await challengesApi.join(id);
            await fetchChallenges(); // Refresh lists
        } catch (error: any) {
            console.error('Failed to join challenge:', error);
            alert(error.message || 'Failed to join challenge');
        }
    };

    const handleViewChallenge = async (id: number) => {
        try {
            const res = await challengesApi.getLeaderboard(id);
            setLeaderboard(res.leaderboard || []);
            setSelectedChallenge(id);
            setShowLeaderboard(true);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    };

    const getCurrentChallenges = () => {
        switch (activeTab) {
            case 'available':
                return availableChallenges;
            case 'active':
                return activeChallenges;
            case 'completed':
                return completedChallenges;
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingText}>Loading Challenges...</div>
            </div>
        );
    }

    const currentChallenges = getCurrentChallenges();

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
                    <span>Challenges</span>
                </div>
                <nav className={styles.nav}>
                    <button className={styles.navLink} onClick={() => router.push('/dashboard')}>Dashboard</button>
                    <button className={styles.navLink} onClick={() => router.push('/statistics')}>Statistics</button>
                    <button className={styles.navLink} onClick={() => router.push('/challenges')}>Challenges</button>
                    <button className={styles.navLink} onClick={() => router.push('/leaderboard')}>Leaderboard</button>
                    <button className={styles.navLink} onClick(() => router.push('/compare')}>Compare</button>
                </nav>
            </header>

            <main className={styles.main}>
                <div className={styles.intro}>
                    <h2 className={styles.title}>Challenges</h2>
                    <p className={styles.subtitle}>
                        Boost your productivity, enhance your well-being, and transform your behavior with exciting challenges!
                    </p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'available' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('available')}
                    >
                        Available ({availableChallenges.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active ({activeChallenges.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed ({completedChallenges.length})
                    </button>
                </div>

                {currentChallenges.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🎯</div>
                        <p className={styles.emptyText}>
                            {activeTab === 'available' && 'No available challenges at the moment'}
                            {activeTab === 'active' && 'You haven\'t joined any challenges yet'}
                            {activeTab === 'completed' && 'No completed challenges yet'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.challengeGrid}>
                        {currentChallenges.map((challenge) => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                onJoin={handleJoinChallenge}
                                onView={handleViewChallenge}
                                isActive={activeTab === 'active'}
                            />
                        ))}
                    </div>
                )}
            </main>

            {
        showLeaderboard && (
            <div className={styles.modalOverlay} onClick={() => setShowLeaderboard(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalTitle}>Leaderboard</h3>
                    <div className={styles.leaderboardList}>
                        {leaderboard.length > 0 ? (
                            leaderboard.map((entry, index) => (
                                <div key={entry.player_id} className={styles.leaderboardItem}>
                                    <span className={styles.rank}>#{entry.position}</span>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.username}>{entry.username}</span>
                                        <span className={styles.level}>Lv. {entry.level}</span>
                                    </div>
                                    <div className={styles.progress}>
                                        {entry.current_progress} / {entry.target_count}
                                    </div>
                                    {entry.status === 'completed' && (
                                        <span className={styles.completed}>✅</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyText}>No leaderboard data</p>
                        )}
                    </div>
                    <button className="btn btn-secondary" onClick={() => setShowLeaderboard(false)}>
                        Close
                    </button>
                </div>
            </div>
        )
    }
        </div >
    );
}
