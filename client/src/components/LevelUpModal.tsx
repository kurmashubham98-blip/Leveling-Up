'use client';

import { useEffect, useState } from 'react';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.overlay} ${show ? styles.visible : ''}`}>
      <div className={styles.modal}>
        <div className={styles.glow}></div>
        <div className={styles.content}>
          <div className={styles.systemTag}>[ SYSTEM NOTIFICATION ]</div>
          <h2 className={styles.title}>LEVEL UP!</h2>
          <div className={styles.levelDisplay}>
            <span className={styles.levelNumber}>{level}</span>
          </div>
          <p className={styles.message}>You have grown stronger.</p>
          <p className={styles.bonus}>+5 Stat Points Acquired</p>
        </div>
      </div>
    </div>
  );
}

