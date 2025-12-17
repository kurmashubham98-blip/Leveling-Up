'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="animate-pulse-glow" style={{
        fontSize: '3rem',
        fontFamily: 'Orbitron, sans-serif',
        color: 'var(--accent-blue)',
        textShadow: '0 0 20px var(--accent-blue)'
      }}>
        ARISE
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>
        Initializing System...
      </div>
    </div>
  );
}

