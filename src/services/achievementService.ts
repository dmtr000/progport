import axios from 'axios';

export interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  type: 'course' | 'exercise' | 'forum' | 'streak';
  requirement: number;
  points: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export const achievementService = {
  // Получить все достижения с прогрессом пользователя
  async getUserAchievements(): Promise<Achievement[]> {
    const response = await axios.get('/achievements');
    return response.data;
  },

  // Обновить прогресс достижения
  async updateProgress(achievementId: string, progress: number): Promise<void> {
    await axios.post('/achievements/progress', { achievementId, progress });
  },

  // Проверить и обновить достижения пользователя
  async checkAchievements(stats: {
    coursesCompleted?: number;
    exercisesCompleted?: number;
    forumPosts?: number;
    streak?: number;
  }): Promise<void> {
    const achievements = await this.getUserAchievements();
    
    for (const achievement of achievements) {
      let currentProgress = 0;
      
      switch (achievement.type) {
        case 'course':
          currentProgress = stats.coursesCompleted || 0;
          break;
        case 'exercise':
          currentProgress = stats.exercisesCompleted || 0;
          break;
        case 'forum':
          currentProgress = stats.forumPosts || 0;
          break;
        case 'streak':
          currentProgress = stats.streak || 0;
          break;
      }

      if (currentProgress > (achievement.progress || 0)) {
        await this.updateProgress(achievement._id, currentProgress);
      }
    }
  }
}; 