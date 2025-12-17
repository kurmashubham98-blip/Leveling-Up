'use client';

import { useEffect, useRef } from 'react';
import styles from './ProductivityChart.module.css';

interface ProductivityChartProps {
    percentage: number;
    size?: number;
}

export default function ProductivityChart({ percentage, size = 200 }: ProductivityChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 15;
        const lineWidth = 12;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(42, 42, 46, 0.5)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Progress arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (2 * Math.PI * percentage / 100);

        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#4a9eff');
        gradient.addColorStop(0.5, '#5ce1e6');
        gradient.addColorStop(1, '#a855f7');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#4a9eff';
        ctx.stroke();

    }, [percentage, size]);

    return (
        <div className={styles.container}>
            <canvas ref={canvasRef} width={size} height={size} className={styles.canvas} />
            <div className={styles.percentage}>
                <div className={styles.value}>{Math.round(percentage)}%</div>
                <div className={styles.label}>Productivity</div>
            </div>
        </div>
    );
}
