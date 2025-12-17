'use client';

import styles from './Heatmap.module.css';

interface HeatmapProps {
  data: Record<string, number>; // { '2024-01-15': 3, '2024-01-16': 1 }
}

export default function Heatmap({ data }: HeatmapProps) {
  // Generate last 365 days
  const days = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: data[dateStr] || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  
  days.forEach((day, index) => {
    if (index === 0) {
      // Pad first week
      for (let i = 0; i < day.dayOfWeek; i++) {
        currentWeek.push({ date: '', count: -1, dayOfWeek: i });
      }
    }
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getLevel = (count: number) => {
    if (count <= 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const dayLabels = ['', 'mon', '', 'wed', '', 'fri', ''];

  // Get month labels positions
  const monthLabels: { month: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstValidDay = week.find(d => d.date);
    if (firstValidDay) {
      const month = new Date(firstValidDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: months[month], index: weekIndex });
        lastMonth = month;
      }
    }
  });

  const totalActivity = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{totalActivity} activities</span>
        <div className={styles.legend}>
          <span>less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`${styles.cell} ${styles[`level${level}`]}`} />
          ))}
          <span>more</span>
        </div>
      </div>

      <div className={styles.heatmapWrapper}>
        <div className={styles.dayLabels}>
          {dayLabels.map((label, i) => (
            <span key={i} className={styles.dayLabel}>{label}</span>
          ))}
        </div>

        <div className={styles.gridContainer}>
          <div className={styles.monthLabels}>
            {monthLabels.map(({ month, index }) => (
              <span 
                key={`${month}-${index}`} 
                className={styles.monthLabel}
                style={{ gridColumn: index + 1 }}
              >
                {month}
              </span>
            ))}
          </div>
          
          <div className={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={styles.week}>
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`${styles.cell} ${day.count >= 0 ? styles[`level${getLevel(day.count)}`] : styles.empty}`}
                    title={day.date ? `${day.date}: ${day.count} activities` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.note}>
        Note: Activity data is based on quest completions
      </div>
    </div>
  );
}

