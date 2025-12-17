'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { player as playerApi, quests as questsApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import StatusWindow from '@/components/StatusWindow';
import QuestCard from '@/components/QuestCard';
import LevelUpModal from '@/components/LevelUpModal';
import Heatmap from '@/components/Heatmap';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });
const Crystal3D = dynamic(() => import('@/components/Crystal3D'), { ssr: false });
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { player, quests, fetchPlayer, fetchQuests, completeQuest, logout } = useGameStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [questForm, setQuestForm] = useState({
    name: '',
    description: '',
    questType: 'daily',
    difficulty: 'easy',
    targetCount: 1,
    statType: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPlayer();
    fetchQuests();

    // Fetch real activity data from backend
    const fetchActivity = async () => {
      try {
        const data = await playerApi.getActivity();
        setActivityData(data.activity || {});
      } catch (error) {
        console.error('Failed to fetch activity:', error);
        setActivityData({});
      }
    };
    fetchActivity();
  }, [fetchPlayer, fetchQuests, router]);

  const handleComplete = async (questId: number) => {
    try {
      const result = await completeQuest(questId);

      // Update activity data
      const today = new Date().toISOString().split('T')[0];
      setActivityData(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
      }));

      if (result.levelUp) {
        setNewLevel(result.newLevel);
        setShowLevelUp(true);
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  const handleDelete = async (questId: number) => {
    try {
      await questsApi.delete(questId);
      fetchQuests();
    } catch (error) {
      console.error('Failed to delete quest:', error);
    }
  };

  const handleAllocateStat = async (stat: string) => {
    try {
      await playerApi.allocateStats({ [stat]: 1 });
      fetchPlayer();
    } catch (error) {
      console.error('Failed to allocate stat:', error);
    }
  };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await questsApi.create(questForm);
      fetchQuests();
      setShowNewQuest(false);
      setQuestForm({
        name: '',
        description: '',
        questType: 'daily',
        difficulty: 'easy',
        targetCount: 1,
        statType: '',
      });
    } catch (error) {
      console.error('Failed to create quest:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!player) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  const activeQuests = quests.filter(q => q.status === 'active');
  const filteredQuests = activeTab === 'all'
    ? activeQuests
    : activeQuests.filter(q => q.quest_type === activeTab);

  return (
    <div className={styles.container}>
      <ParticleBackground />

      {showLevelUp && (
        <LevelUpModal level={newLevel} onClose={() => setShowLevelUp(false)} />
      )}

      <header className={styles.header}>
        <div className={styles.logo}>ARISE</div>
        <nav className={styles.nav}>
          <button className={styles.navLink} onClick={() => router.push('/dashboard')}>
            Dashboard
          </button>
          <button className={styles.navLink} onClick={() => router.push('/statistics')}>
            Statistics
          </button>
          <button className={styles.navLink} onClick={() => router.push('/challenges')}>
            Challenges
          </button>
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.crystalWrapper}>
            <Crystal3D level={player.level} rankColor={player.rank_color || '#4a9eff'} />
          </div>
          <StatusWindow player={player} onAllocateStat={handleAllocateStat} />
          <Heatmap data={activityData} />
        </aside>

        <section className={styles.content}>
          <div className={styles.questHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.systemTag}>TODAY</span>
              Quests
            </h2>
            <button
              className={`btn btn-primary ${styles.addBtn}`}
              onClick={() => setShowNewQuest(true)}
            >
              + Add Quest
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'daily' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              Daily
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'weekly' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('weekly')}
            >
              Weekly
            </button>
          </div>

          {filteredQuests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No quests yet. Add one to start leveling up!</p>
            </div>
          ) : (
            <div className={styles.questList}>
              {filteredQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showNewQuest && (
        <div className={styles.modalOverlay} onClick={() => setShowNewQuest(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>New Quest</h3>
            <form onSubmit={handleCreateQuest} className={styles.questForm}>
              <div className={styles.formGroup}>
                <label>Quest Name</label>
                <input
                  type="text"
                  className="input"
                  value={questForm.name}
                  onChange={(e) => setQuestForm({ ...questForm, name: e.target.value })}
                  placeholder="e.g., Drink 8 glasses of water"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description (optional)</label>
                <textarea
                  className="input"
                  value={questForm.description}
                  onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                  placeholder="Add details..."
                  rows={2}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select
                    className="input"
                    value={questForm.questType}
                    onChange={(e) => setQuestForm({ ...questForm, questType: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="side">One-time</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Difficulty</label>
                  <select
                    className="input"
                    value={questForm.difficulty}
                    onChange={(e) => setQuestForm({ ...questForm, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="nightmare">Nightmare</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Target</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={questForm.targetCount}
                    onChange={(e) => setQuestForm({ ...questForm, targetCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    className="input"
                    value={questForm.statType}
                    onChange={(e) => setQuestForm({ ...questForm, statType: e.target.value })}
                  >
                    <option value="">General</option>
                    <option value="strength">Fitness</option>
                    <option value="agility">Cardio</option>
                    <option value="intelligence">Learning</option>
                    <option value="vitality">Health</option>
                    <option value="luck">Misc</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewQuest(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
