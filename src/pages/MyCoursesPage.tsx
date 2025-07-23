import React, { useState, useEffect } from 'react';
import CourseList from '../components/courses/CourseList';
import axios from 'axios';
import { Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Navigate } from 'react-router-dom';

const MyCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const response = await axios.get('/auth/me');
        const userEnrolledCourses = response.data.enrolledCourses || [];
        
        // Преобразуем данные курсов и фильтруем удаленные
        const coursesWithProgress = userEnrolledCourses
          .filter((enrollment: any) => enrollment.courseId && enrollment.courseId._id) // Фильтруем удаленные курсы
          .map((enrollment: any) => ({
            ...enrollment.courseId,
            progress: enrollment.progress || 0,
            isEnrolled: true,
            startDate: enrollment.startDate,
            lastAccessDate: enrollment.lastAccessDate,
            completed: enrollment.completed,
            moduleProgress: enrollment.moduleProgress
          }));

        // Сортируем по прогрессу (незавершенные первыми)
        const sortedCourses = coursesWithProgress.sort((a, b) => {
          if (a.progress === 100 && b.progress !== 100) return 1;
          if (a.progress !== 100 && b.progress === 100) return -1;
          return b.progress - a.progress;
        });

        setCourses(sortedCourses);
      } catch (err) {
        console.error('Ошибка загрузки курсов:', err);
        setError('Не удалось загрузить ваши курсы. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Мои курсы</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Продолжите обучение с того места, где остановились
          </p>
        </div>
        {courses.length > 0 ? (
          <CourseList courses={courses} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              У вас пока нет записанных курсов. 
              <a href="/courses" className="text-blue-600 hover:text-blue-800 ml-1">
                Просмотреть доступные курсы
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage; 