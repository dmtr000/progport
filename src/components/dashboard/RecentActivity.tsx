import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ActivityType, Activity as BaseActivity } from '../../types/dashboard';
import { getActivityIcon, formatRelativeTime } from '../../utils/dashboardUtils';

interface Activity extends BaseActivity {
  _id: string;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('/users/activities');
        setActivities(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Не удалось загрузить последние действия');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg">
      <div className="px-6 py-4 border-b-2 border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Последние действия</h2>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="px-6 py-4 text-center text-gray-500">
            Загрузка...
          </div>
        ) : error ? (
          <div className="px-6 py-4 text-center text-red-500">
            {error}
          </div>
        ) : activities.length > 0 ? (
          activities.slice(0, 4).map((activity) => (
            <div key={activity._id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <span className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">
            Нет последних действий
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;