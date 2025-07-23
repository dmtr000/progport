export type ActivityType = 'course' | 'exercise' | 'forum' | 'achievement';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  timestamp: string;
  description?: string;
}

export interface StatItem {
  title: string;
  value: number;
  total: number;
  percentage: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning';
}