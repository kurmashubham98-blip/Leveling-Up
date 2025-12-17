'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaderboard as leaderboardApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useWebSocket } from '@/lib/useWebSocket';
import RankBadge from '@/components/RankBadge';
import styles from './leaderboard.module.css';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });

export default function LeaderboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [myRank, setMyRank] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const socket = useWebSocket();

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);

            const [leaderboardRes, myRankRes] = await Promise.all([
                activeFilter === 'all'
                    ? leaderboardApi.getGlobal()
                    : leaderboardApi.getByRank(activeFilter),
                leaderboardApi.getMyRank()
            ]);

            setLeaderboard(leaderboardRes.leaderboard || []);
            setMyRank(myRankRes.playerRank);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchLeaderboard();
    }, [router, activeFilter]);

    useEffect(() => {
        if (!socket) return;
        socket.on('leaderboardUpdated', fetchLeaderboard);
        socket.on('levelUp', fetchLeaderboard);
        return () => {
            socket.off('leaderboardUpdated', fetchLeaderboard);
            socket.off('levelUp', fetchLeaderboard);
        };
    }, [socket, activeFilter]);

    const filteredLeaderboard = searchQuery
        ? leaderboard.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
        : leaderboard;

    const getMedalIcon = (position: number) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return null;
    };

    const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];

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
                    <span>Leaderboard</span>
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
                {myRank && (
                    <div className={styles.myRankCard}>
                        <span className={styles.myRankLabel}>Your Rank</span>
                        <div className={styles.myRankContent}>
                            <span className={styles.rankPosition}>#{myRank.rank_position}</span>
                            <RankBadge rank={myRank.rank_name} color={myRank.rank_color} />
                            <span className={styles.level}>Level {myRank.level}</span>
                        </div>
                    </div>
                )}

                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        All Ranks
                    </button>
                    {ranks.map(rank => (
                        <button
                            key={rank}
                            className={`${styles.filterBtn} ${activeFilter === rank ? styles.active : ''}`}
                            onClick={() => setActiveFilter(rank)}
                        >
                            {rank}-Rank
                        </button>
                    ))}
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading leaderboard...</div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>Level</th>
                                    <th>XP</th>
                                    <th>Quests</th>
                                    <th>Streak</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaderboard.map((player: any) => (
                                    <tr
                                        key={player.player_id}
                                        className={player.player_id === myRank?.player_id ? styles.myRow : ''}
                                    >
                                        <td className={styles.rankCell}>
                                            {getMedalIcon(player.rank_position)}
                                            {player.rank_position}
                                        </td>
                                        <td className={styles.playerCell}>
                                            <RankBadge rank={player.rank_name} color={player.rank_color} size="small" />
                                            <span className={styles.username}>{player.username}</span>
                                        </td>
                                        <td>{player.level}</td>
                                        <td>{player.total_xp.toLocaleString()}</td>
                                        <td>{player.total_quests}</td>
                                        <td className={styles.streakCell}>🔥 {player.current_streak}</td>
                                        <td>
                                            <button
                                                className={styles.compareBtn}
                                                onClick={() => router.push(`/compare?player=${player.player_id}`)}
                                            >
                                                Compare
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
