import React, { useState, useEffect } from 'react';
import CourseList from '../components/courses/CourseList';
import axios from 'axios';
import { Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Получаем список всех курсов
        const coursesResponse = await axios.get('/courses');
        let coursesData = coursesResponse.data;
        
        // Фильтруем невалидные курсы и добавляем значения по умолчанию
        coursesData = coursesData
          .filter((course: Course | null) => course && (course._id || course.id))
          .map((course: Course) => ({
            ...course,
            enrolled: course.enrolled || 0,
            modules: course.modules || [],
            lessons: course.lessons || 0
          }));

        // Сортируем курсы по количеству записанных студентов (по убыванию)
        coursesData.sort((a: Course, b: Course) => (b.enrolled || 0) - (a.enrolled || 0));

        // Если пользователь авторизован, получаем информацию о записи на курсы
        if (isAuthenticated && token) {
          try {
            // Получаем информацию о записанных курсах пользователя
            const userResponse = await axios.get('/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const enrolledCourses = userResponse.data?.enrolledCourses || [];

            // Обновляем данные курсов, добавляя информацию о записи
            coursesData = coursesData.map((course: Course) => {
              // Находим запись о курсе в enrolledCourses пользователя
              const enrolledCourse = enrolledCourses.find(
                (ec: any) => {
                  if (!ec || !ec.courseId) return false;
                  const enrolledCourseId = ec.courseId._id || ec.courseId;
                  const courseId = course._id || course.id;
                  return enrolledCourseId === courseId;
                }
              );

              return {
                ...course,
                isEnrolled: !!enrolledCourse,
                progress: enrolledCourse?.progress || 0
              };
            });
          } catch (err) {
            console.error('Ошибка при получении данных пользователя:', err);
            // Продолжаем выполнение с базовыми данными курсов
          }
        }

        setCourses(coursesData);
      } catch (err) {
        console.error('Ошибка загрузки курсов:', err);
        setError('Не удалось загрузить курсы. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Все курсы</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Просмотрите нашу коллекцию курсов программирования для всех уровней подготовки.
          </p>
        </div>
        <CourseList courses={courses} />
      </div>
    </div>
  );
};

export default CoursesPage;