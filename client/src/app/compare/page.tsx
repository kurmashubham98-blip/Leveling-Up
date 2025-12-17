'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { comparison as comparisonApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import RankBadge from '@/components/RankBadge';
import styles from './compare.module.css';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });

export default function ComparePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetPlayerId = searchParams.get('player');

    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [comparison, setComparison] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchSuggestions();

        if (targetPlayerId) {
            fetchComparison(parseInt(targetPlayerId));
        }
    }, [router, targetPlayerId]);

    const fetchSuggestions = async () => {
        try {
            const res = await comparisonApi.getSuggestions();
            setSuggestions(res.suggestions || []);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    };

    const fetchComparison = async (playerId: number) => {
        try {
            setLoading(true);
            const res = await comparisonApi.compareWith(playerId);
            setComparison(res);
        } catch (error) {
            console.error('Failed to fetch comparison:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;

        try {
            const res = await comparisonApi.searchPlayers(searchQuery);
            setSearchResults(res.players || []);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleCompare = (playerId: number) => {
        router.push(`/compare?player=${playerId}`);
    };

    const getStatBar = (yourValue: number, theirValue: number, maxValue: number = 100) => {
        const yourPercent = (yourValue / maxValue) * 100;
        const theirPercent = (theirValue / maxValue) * 100;

        return { yourPercent, theirPercent, isWinning: yourValue > theirValue };
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
                    <span>Compare</span>
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
                <div className={styles.searchSection}>
                    <h2 className={styles.title}>Compare Players</h2>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} className={styles.searchBtn}>Search</button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className={styles.results}>
                            {searchResults.map((player: any) => (
                                <div key={player.id} className={styles.playerItem} onClick={() => handleCompare(player.id)}>
                                    <RankBadge rank={player.rank_name} color={player.rank_color} size="small" />
                                    <span className={styles.playerName}>{player.username}</span>
                                    <span className={styles.playerLevel}>Lv. {player.level}</span>
                                    <button className={styles.compareBtn}>Compare</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!comparison && suggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        <h3 className={styles.sectionTitle}>Suggested Comparisons</h3>
                        <div className={styles.suggestionGrid}>
                            {suggestions.map((player: any) => (
                                <div key={player.id} className={styles.suggestionCard} onClick={() => handleCompare(player.id)}>
                                    <RankBadge rank={player.rank_name} color={player.rank_color} />
                                    <div className={styles.suggestionInfo}>
                                        <span className={styles.suggestionName}>{player.username}</span>
                                        <span className={styles.suggestionLevel}>Level {player.level}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && <div className={styles.loading}>Loading comparison...</div>}

                {comparison && (
                    <div className={styles.comparisonView}>
                        <div className={styles.playersHeader}>
                            <div className={styles.playerCard}>
                                <RankBadge rank={comparison.currentPlayer.rank_name} color={comparison.currentPlayer.rank_color} size="large" />
                                <h3>{comparison.currentPlayer.username}</h3>
                                <p>Level {comparison.currentPlayer.level}</p>
                                <span className={styles.youLabel}>YOU</span>
                            </div>

                            <div className={styles.vs}>VS</div>

                            <div className={styles.playerCard}>
                                <RankBadge rank={comparison.targetPlayer.rank_name} color={comparison.targetPlayer.rank_color} size="large" />
                                <h3>{comparison.targetPlayer.username}</h3>
                                <p>Level {comparison.targetPlayer.level}</p>
                            </div>
                        </div>

                        <div className={styles.statsComparison}>
                            <h3 className={styles.sectionTitle}>Stats Comparison</h3>

                            {['strength', 'agility', 'intelligence', 'vitality', 'luck'].map((stat) => {
                                const yourValue = comparison.currentPlayer.stats[stat];
                                const theirValue = comparison.targetPlayer.stats[stat];
                                const { yourPercent, theirPercent, isWinning } = getStatBar(yourValue, theirValue, 100);

                                return (
                                    <div key={stat} className={styles.statRow}>
                                        <div className={styles.statLabel}>{stat.toUpperCase()}</div>
                                        <div className={styles.statBars}>
                                            <div className={styles.leftBar}>
                                                <span className={`${styles.statValue} ${isWinning ? styles.winning : ''}`}>{yourValue}</span>
                                                <div className={styles.barContainer}>
                                                    <div className={styles.barFill} style={{ width: `${yourPercent}%`, background: isWinning ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                                                </div>
                                            </div>
                                            <div className={styles.rightBar}>
                                                <div className={styles.barContainer}>
                                                    <div className={styles.barFill} style={{ width: `${theirPercent}%`, background: !isWinning ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                                                </div>
                                                <span className={`${styles.statValue} ${!isWinning ? styles.winning : ''}`}>{theirValue}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.metrics}>
                            <div className={styles.metricCard}>
                                <h4>Total Quests</h4>
                                <div className={styles.metricValues}>
                                    <span className={comparison.winner.quests === 'you' ? styles.winning : ''}>{comparison.currentPlayer.total_quests_completed || 0}</span>
                                    <span>vs</span>
                                    <span className={comparison.winner.quests === 'them' ? styles.winning : ''}>{comparison.targetPlayer.total_quests_completed || 0}</span>
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <h4>Current Streak</h4>
                                <div className={styles.metricValues}>
                                    <span className={comparison.winner.streak === 'you' ? styles.winning : ''}>{comparison.currentPlayer.streak_days}🔥</span>
                                    <span>vs</span>
                                    <span className={comparison.winner.streak === 'them' ? styles.winning : ''}>{comparison.targetPlayer.streak_days}🔥</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
