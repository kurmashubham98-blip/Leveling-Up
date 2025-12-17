'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await auth.register(username, email, password);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.systemOverlay}>
        <div className={styles.gridLines}></div>
      </div>
      
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoText}>ARISE</span>
          <span className={styles.subtitle}>HUNTER REGISTRATION</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>HUNTER NAME</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Sung Jin-Woo"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>EMAIL</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@arise.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>PASSWORD</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'AWAKENING...' : 'BECOME A HUNTER'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Already a Hunter?</span>
          <Link href="/login" className={styles.link}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

