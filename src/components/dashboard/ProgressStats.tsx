import React, { useState, useEffect } from 'react';
import { BookOpen, Award, MessageCircle, Zap } from 'lucide-react';
import axios from 'axios';

interface Stats {
  coursesCompleted: number;
  coursesTotal: number;
  coursesPercentage: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  exercisesPercentage: number;
  forumPosts: number;
  streak: number;
}

const ProgressStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/users/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError('Не удалось загрузить статистику');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Загрузка статистики...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (!stats) {
    return <div className="text-center py-4">Нет доступной статистики</div>;
  }

  const statItems = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      label: 'Курсы',
      value: `${stats.coursesCompleted} из ${stats.coursesTotal}`,
      percentage: stats.coursesPercentage
    },
    {
      icon: <Award className="h-8 w-8 text-green-500" />,
      label: 'Упражнения',
      value: `${stats.exercisesCompleted} из ${stats.exercisesTotal}`,
      percentage: stats.exercisesPercentage
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-purple-500" />,
      label: 'Комментарии',
      value: stats.forumPosts,
      percentage: null,
      suffix: stats.forumPosts === 1 ? 'комментарий' : 
              stats.forumPosts >= 2 && stats.forumPosts <= 4 ? 'комментария' : 
              'комментариев'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      label: 'Серия дней',
      value: stats.streak,
      percentage: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            {item.icon}
            <h3 className="ml-3 text-lg font-medium text-gray-900">{item.label}</h3>
          </div>
          <div className="flex flex-col">
            <p className="text-2xl font-semibold text-gray-900">
              {item.value}
              {item.suffix && <span className="text-base font-normal text-gray-600 ml-2">{item.suffix}</span>}
            </p>
            {item.percentage !== null && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.percentage}% завершено</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressStats;