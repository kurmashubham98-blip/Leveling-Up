'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { player as playerApi, quests as questsApi } from '@/lib/api';
import StatusWindow from '@/components/StatusWindow';
import QuestCard from '@/components/QuestCard';
import LevelUpModal from '@/components/LevelUpModal';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { player, quests, fetchPlayer, fetchQuests, completeQuest, logout } = useGameStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [showNewQuest, setShowNewQuest] = useState(false);
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
  }, [fetchPlayer, fetchQuests, router]);

  const handleComplete = async (questId: number) => {
    try {
      const result = await completeQuest(questId);
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
        <div className={styles.loadingText}>Loading System...</div>
      </div>
    );
  }

  const activeQuests = quests.filter(q => q.status === 'active');

  return (
    <div className={styles.container}>
      {showLevelUp && (
        <LevelUpModal level={newLevel} onClose={() => setShowLevelUp(false)} />
      )}

      <header className={styles.header}>
        <div className={styles.logo}>ARISE</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          LOGOUT
        </button>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <StatusWindow player={player} onAllocateStat={handleAllocateStat} />
        </aside>

        <section className={styles.content}>
          <div className={styles.questHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.systemTag}>[ QUEST LOG ]</span>
              ACTIVE QUESTS
            </h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNewQuest(true)}
            >
              + NEW QUEST
            </button>
          </div>

          {activeQuests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No active quests. Create one to begin your journey!</p>
            </div>
          ) : (
            <div className={styles.questGrid}>
              {activeQuests.map((quest) => (
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
            <h3 className={styles.modalTitle}>CREATE NEW QUEST</h3>
            <form onSubmit={handleCreateQuest} className={styles.questForm}>
              <div className={styles.formGroup}>
                <label>Quest Name</label>
                <input
                  type="text"
                  className="input"
                  value={questForm.name}
                  onChange={(e) => setQuestForm({ ...questForm, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  className="input"
                  value={questForm.description}
                  onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
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
                    <option value="side">Side</option>
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
                  <label>Target Count</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={questForm.targetCount}
                    onChange={(e) => setQuestForm({ ...questForm, targetCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Stat Bonus</label>
                  <select
                    className="input"
                    value={questForm.statType}
                    onChange={(e) => setQuestForm({ ...questForm, statType: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="strength">Strength</option>
                    <option value="agility">Agility</option>
                    <option value="intelligence">Intelligence</option>
                    <option value="vitality">Vitality</option>
                    <option value="luck">Luck</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewQuest(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

