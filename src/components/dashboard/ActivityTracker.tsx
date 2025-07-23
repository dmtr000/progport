import React, { useEffect } from 'react';
import axios from 'axios';
import { achievementService } from '../../services/achievementService';

const ActivityTracker: React.FC = () => {
  useEffect(() => {
    const checkDailyActivity = async () => {
      try {
        // Проверяем, была ли активность сегодня
        const lastActivityResponse = await axios.get('/users/last-activity');
        const { lastActivity } = lastActivityResponse.data;

        const now = new Date();
        const lastActivityDate = new Date(lastActivity);

        // Если последняя активность была не сегодня, обновляем дату
        if (lastActivityDate.toDateString() !== now.toDateString()) {
          await axios.post('/users/activity');
          
          // Получаем обновленную статистику
          const statsResponse = await axios.get('/users/stats');
          const { streak } = statsResponse.data;

          // Проверяем достижения
          await achievementService.checkAchievements({
            streak
          });
        }
      } catch (error) {
        console.error('Error checking daily activity:', error);
      }
    };

    // Проверяем активность при монтировании компонента
    checkDailyActivity();

    // Проверяем активность каждый час
    const interval = setInterval(checkDailyActivity, 3600000);

    return () => clearInterval(interval);
  }, []);

  // Этот компонент не рендерит UI
  return null;
};

export default ActivityTracker; 