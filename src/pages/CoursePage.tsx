import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import { ChevronRight, BookOpen, Code, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface Lesson {
  id: string;
  _id?: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  completed: boolean;
}

interface Module {
  id: string;
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  _id?: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  language: string;
  enrolled: number;
  progress?: number;
  modules?: Module[];
  isEnrolled?: boolean;
}

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();

  const fetchCourseProgress = async () => {
    try {
      if (!courseId || !isAuthenticated) return;

      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.get(`/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Progress data:', response.data);
      return response.data;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        console.log('No progress found for this course');
        return null;
      }
      console.error('Ошибка при получении прогресса:', error);
      toast.error('Не удалось загрузить прогресс курса');
      return null;
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId) {
          throw new Error('ID курса не указан');
        }

        setLoading(true);
        const [courseResponse, progressData] = await Promise.all([
          axios.get(`/courses/${courseId}`),
          fetchCourseProgress()
        ]);
        
        console.log('Course data:', courseResponse.data);
        console.log('Progress data in effect:', progressData);

        if (!courseResponse.data) {
          throw new Error('Курс не найден');
        }

        const courseData: Course = {
          ...courseResponse.data,
          id: courseResponse.data._id || courseResponse.data.id || courseId,
          modules: Array.isArray(courseResponse.data.modules) 
            ? courseResponse.data.modules.map((module: any) => ({
                ...module,
                id: module._id || module.id,
                lessons: Array.isArray(module.lessons)
                  ? module.lessons.map((lesson: any) => ({
                      ...lesson,
                      id: lesson._id || lesson.id,
                      completed: progressData?.moduleProgress?.find((mp: any) => 
                        mp.moduleId === module._id
                      )?.completedLessons?.some((cl: any) => 
                        cl.lessonId === lesson._id
                      ) || false
                    }))
                  : []
              }))
            : [],
          isEnrolled: !!progressData,
          progress: typeof progressData?.progress === 'number' ? progressData.progress : 0,
          enrolled: courseResponse.data.enrolled || 0
        };

        console.log('Progress value:', progressData?.progress);
        console.log('Final course data with progress:', courseData);
        setCourse(courseData);
      } catch (error) {
        console.error('Ошибка загрузки курса:', error);
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке курса');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, isAuthenticated]);

  const handleEnrollCourse = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!courseId) {
      toast.error('Ошибка: ID курса не найден');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Необходима авторизация');
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    try {
      setEnrolling(true);
      const response = await axios.post(
        `/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.enrollment) {
        setCourse(prev => prev ? {
          ...prev,
          isEnrolled: true,
          enrolled: (prev.enrolled || 0) + 1,
          progress: 0
        } : null);

        toast.success('Вы успешно записались на курс!');
      } else {
        throw new Error('Неверный формат ответа от сервера');
      }
    } catch (error: any) {
      console.error('Ошибка при записи на курс:', error);
      const errorMessage = error.response?.data?.message || 'Не удалось записаться на курс. Попробуйте позже.';
      toast.error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLesson = (moduleId: string, lessonId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!course?.isEnrolled) {
      toast.error('Для начала запишитесь на курс');
      return;
    }

    navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error || 'Курс не найден'}</p>
          <div className="flex flex-col space-y-3">
            <Button
              variant="primary"
              onClick={() => navigate('/courses')}
              className="w-full"
            >
              Вернуться к списку курсов
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок курса */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600">{course.description}</p>
              
              <div className="mt-6">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {course.duration}
                  </span>
                  <span className="flex items-center">
                    <Code className="h-4 w-4 mr-1" />
                    {course.language}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.enrolled || 0} учащихся
                  </span>
                </div>
                
                {course.isEnrolled && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Общий прогресс</span>
                      <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
                    </div>
                    <ProgressBar 
                      value={course.progress} 
                      variant="primary" 
                      size="lg" 
                      animated 
                      showValue
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      {course.progress === 0 
                        ? 'Начните изучение курса' 
                        : `Завершено ${course.progress}% курса`
                      }
                    </div>
                  </div>
                )}

                {!course.isEnrolled ? (
                  <div className="mt-6">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleEnrollCourse}
                      disabled={enrolling}
                      className="w-full sm:w-auto"
                    >
                      {enrolling ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Записываемся...
                        </>
                      ) : (
                        'Записаться на курс'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        // Ищем первый незавершенный урок по всем модулям
                        if (course.modules) {
                          // Перебираем все модули
                          for (const module of course.modules) {
                            // Ищем первый незавершенный урок в текущем модуле
                            const firstIncompleteLesson = module.lessons.find(lesson => !lesson.completed);
                            if (firstIncompleteLesson) {
                              // Если нашли незавершенный урок, переходим к нему
                              handleStartLesson(module.id, firstIncompleteLesson.id);
                              return;
                            }
                          }
                          // Если все уроки завершены, переходим к первому уроку первого модуля
                          const firstModule = course.modules[0];
                          if (firstModule && firstModule.lessons.length > 0) {
                            handleStartLesson(firstModule.id, firstModule.lessons[0].id);
                          }
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Продолжить обучение
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <img 
              src={course.imageUrl} 
              alt={course.title} 
              className="w-full md:w-64 h-48 object-cover rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Модули курса */}
        <div className="space-y-6">
          {course.modules && course.modules.length > 0 ? (
            course.modules
              .sort((a, b) => a.order - b.order)
              .map((module) => (
                <Card key={module.id}>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Модуль {module.order}: {module.title}
                    </h2>
                    <p className="text-gray-600 mb-6">{module.description}</p>
                    
                    {/* Уроки */}
                    <div className="space-y-4">
                      {module.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <div
                            key={lesson.id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {lesson.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                )}
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">
                                    Урок {lesson.order}: {lesson.title}
                                  </h3>
                                  <p className="text-sm text-gray-500">{lesson.duration}</p>
                                </div>
                              </div>
                              <Button
                                variant={lesson.completed ? 'success' : 'primary'}
                                size="sm"
                                icon={<ChevronRight className="h-4 w-4" />}
                                onClick={() => handleStartLesson(module.id, lesson.id)}
                              >
                                {lesson.completed ? 'Повторить' : 'Начать'}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-medium text-gray-900 mb-2">В этом курсе пока нет модулей</h3>
              <p className="text-gray-500 mb-6">Попробуйте зайти позже</p>
              <Button
                variant="outline"
                onClick={() => navigate('/courses')}
              >
                Вернуться к списку курсов
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;