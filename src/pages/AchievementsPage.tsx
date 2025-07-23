import React, { useState, useEffect } from 'react';
import AchievementCard from '../components/dashboard/AchievementCard';
import { achievementService, Achievement } from '../services/achievementService';
import { Loader } from 'lucide-react';
import axios from 'axios';

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Получаем текущую статистику
        const statsResponse = await axios.get('/users/stats');
        const { coursesCompleted, exercisesCompleted, forumReplies: forumPosts, streak } = statsResponse.data;

        // Проверяем достижения с текущей статистикой
        await achievementService.checkAchievements({
          coursesCompleted,
          exercisesCompleted,
          forumPosts,
          streak
        });

        // Получаем обновленный список достижений
        const data = await achievementService.getUserAchievements();
        setAchievements(data);
      } catch (error) {
        console.error('Ошибка загрузки достижений:', error);
        setError('Не удалось загрузить достижения');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  // Разделяем достижения на разблокированные и заблокированные
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ваши достижения</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Отслеживайте свой прогресс и открывайте новые достижения в процессе обучения.
          </p>
          <div className="mt-4 text-lg">
            <span className="font-semibold text-green-600">{unlockedAchievements.length}</span>
            <span className="text-gray-600"> из </span>
            <span className="font-semibold text-gray-900">{achievements.length}</span>
            <span className="text-gray-600"> достижений разблокировано</span>
          </div>
        </div>

        {unlockedAchievements.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Разблокированные достижения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement._id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Предстоящие достижения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement._id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">Нет доступных достижений</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;