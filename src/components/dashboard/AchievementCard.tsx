import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Trophy, Award, Target, Calendar } from 'lucide-react';
import { Achievement } from '../../services/achievementService';

interface AchievementCardProps {
  achievement: Achievement;
}

const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'course':
      return <Award className="h-6 w-6 text-yellow-500" />;
    case 'exercise':
      return <Target className="h-6 w-6 text-green-500" />;
    case 'forum':
      return <Trophy className="h-6 w-6 text-purple-500" />;
    case 'streak':
      return <Calendar className="h-6 w-6 text-blue-500" />;
    default:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
  }
};

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const progress = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <Card className={`${achievement.isUnlocked ? 'border-green-500' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-full ${achievement.isUnlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
            {getAchievementIcon(achievement.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
            <p className="text-sm text-gray-600">{achievement.description}</p>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    achievement.isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">
                  {achievement.progress} / {achievement.requirement}
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {achievement.points} очков
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;