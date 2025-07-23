import React from 'react';
import { ExternalLink, Clock, BookOpen, Users } from 'lucide-react';
import { Card, CardImage, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import { Course } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLevelVariant, getLevelText, formatEnrolledCount } from '../../utils/courseUtils';

interface CourseCardProps {
  course: Course;
  isPopular?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isPopular = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCourseAction = () => {
    navigate(
      isAuthenticated ? `/courses/${course._id}` : '/login',
      isAuthenticated ? undefined : { state: { from: `/courses/${course.id}` } }
    );
  };

  const getButtonText = () => {
    if (isPopular) {
      return 'Подробнее';
    }
    if (course.isEnrolled) {
      return 'Продолжить обучение';
    }
    return isAuthenticated ? 'Начать курс' : 'Записаться на курс';
  };

  const modulesCount = typeof course.modules === 'number' ? course.modules : course.modules?.length || 0;
  const lessonsCount = typeof course.lessons === 'number' ? course.lessons : 
    (Array.isArray(course.modules) ? course.modules.reduce((total, module) => total + module.lessons.length, 0) : 0);

  return (
    <Card hoverable className="h-full flex flex-col">
      <CardImage src={course.imageUrl} alt={course.title} />
      
      <CardContent className="flex-grow">
        <div className="flex justify-between items-start">
          <Badge variant={getLevelVariant(course.level)} className="mb-2">
            {getLevelText(course.level)}
          </Badge>
          <span className="text-sm text-gray-500">{course.language}</span>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-6">{course.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Clock size={16} className="mr-1" />
          <span>{course.duration}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <BookOpen size={16} className="mr-1" />
          <span>{`${modulesCount} модулей • ${lessonsCount} уроков`}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Users size={16} className="mr-1" />
          <span>{formatEnrolledCount(course.enrolled)} учащихся</span>
        </div>
        
        {course.isEnrolled && !isPopular && typeof course.progress === 'number' && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Прогресс</span>
              <span className="text-xs font-medium text-gray-700">{course.progress}%</span>
            </div>
            <ProgressBar 
              value={course.progress} 
              variant="primary" 
              size="sm" 
              animated 
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button
          variant={course.isEnrolled && !isPopular ? 'primary' : 'outline'}
          fullWidth
          icon={<ExternalLink size={16} />}
          onClick={handleCourseAction}
        >
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;