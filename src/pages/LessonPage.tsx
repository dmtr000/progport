import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ChevronLeft, ChevronRight, PlayCircle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import CodeEditor from '../components/CodeEditor';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Course } from '../types';

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface Exercise {
  title: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  language?: string;
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  order: number;
  completed: boolean;
  examples?: string[];
  exercise?: Exercise;
}

interface TestResult {
  passed: boolean;
  input: string;
  output?: string;
  expectedOutput: string;
  error?: string;
  description: string;
}

interface SubmissionResponse {
  success: boolean;
  results: TestResult[];
  lessonCompleted: boolean;
  navigation?: {
    hasNextLesson: boolean;
    nextLessonId?: string;
    nextModuleId?: string;
  };
}

interface CourseProgress {
  courseId: string;
  progress: number;
  moduleProgress: Array<{
    moduleId: string;
    completedLessons: Array<{
      lessonId: string;
      completedAt: string;
    }>;
    completed: boolean;
  }>;
}

const LessonPage: React.FC = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Получаем токен из localStorage
  const token = localStorage.getItem('token');

  // Сброс состояния при изменении урока
  useEffect(() => {
    setCode('');
    setOutput(null);
    setError('');
  }, [lessonId]);

  // Проверка записи на курс и получение прогресса
  const fetchCourseProgress = async () => {
    try {
      if (!courseId || !isAuthenticated) return;

      const response = await axios.get(`/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCourseProgress(response.data);
      setIsEnrolled(true);
      return response.data;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        setIsEnrolled(false);
      } else {
        console.error('Ошибка при получении прогресса:', error);
        toast.error('Не удалось загрузить прогресс курса');
      }
      return null;
    }
  };

  // Загрузка урока и прогресса
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId || !moduleId || !lessonId) {
          throw new Error('Отсутствуют необходимые параметры');
        }

        setLoading(true);
        const [lessonResponse, progressData, courseResponse] = await Promise.all([
          axios.get(
            `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          ),
          fetchCourseProgress(),
          axios.get(`/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!lessonResponse.data) {
          throw new Error('Урок не найден');
        }

        if (!courseResponse.data) {
          throw new Error('Курс не найден');
        }

        setCourse(courseResponse.data);

        // Проверяем, завершен ли урок
        const isCompleted = progressData?.moduleProgress?.some(module => 
          module.moduleId === moduleId && 
          module.completedLessons.some(lesson => 
            lesson.lessonId === lessonId
          )
        );

        setLesson({
          ...lessonResponse.data,
          completed: isCompleted || false
        });

        // Устанавливаем начальный код из урока, если он есть
        if (lessonResponse.data.exercise?.starterCode) {
          setCode(lessonResponse.data.exercise.starterCode);
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить урок');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, moduleId, lessonId, token, isAuthenticated]);

  // Отправка кода на проверку или завершение теоретического урока
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!isEnrolled) {
      toast.error('Для начала запишитесь на курс');
      navigate(`/courses/${courseId}`);
      return;
    }

    setSubmitting(true);
    setOutput(null);

    try {
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await axios.post(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/submit`,
        { 
          code,
          isTheoryOnly: !lesson?.exercise 
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOutput(response.data);

      if (response.data.success || response.data.lessonCompleted) {
        // Обновляем статус урока как завершенного
        setLesson(prev => prev ? { ...prev, completed: true } : null);
        
        // Обновляем прогресс курса
        await fetchCourseProgress();

        // Показываем уведомление об успехе
        toast.success(
          lesson?.exercise 
            ? 'Поздравляем! Все тесты пройдены успешно!' 
            : 'Урок успешно завершен!'
        );

        // Если есть информация о следующем уроке, перенаправляем на него через 1.5 секунды
        if (response.data.navigation?.hasNextLesson) {
          setTimeout(() => {
            const { nextLessonId, nextModuleId } = response.data.navigation;
            navigate(`/courses/${courseId}/modules/${nextModuleId}/lessons/${nextLessonId}`);
          }, 1500);
        } else {
          // Если следующего урока нет, показываем сообщение о завершении и возвращаемся к курсу
          setTimeout(() => {
            toast.success('Поздравляем! Вы завершили все уроки в этом модуле!');
            navigate(`/courses/${courseId}`);
          }, 1500);
        }
      } else if (response.data.results) {
        // Показываем результаты тестов
        const failedTests = response.data.results.filter((r: TestResult) => !r.passed).length;
        if (failedTests > 0) {
          toast.error(`Не все тесты пройдены. Проверьте результаты и попробуйте снова.`);
        }
      }
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error('Произошла ошибка при отправке решения');
      setError('Ошибка при проверке решения');
    } finally {
      setSubmitting(false);
    }
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Ошибка при загрузке
  if (error || !lesson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error || 'Урок не найден'}</p>
          <Button
            variant="primary"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="w-full"
          >
            Вернуться к курсу
          </Button>
        </div>
      </div>
    );
  }

  // Проверка записи на курс
  if (!isEnrolled) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Запись на курс</h2>
          <p className="text-gray-600 mb-6">
            Для доступа к этому уроку необходимо записаться на курс
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="w-full"
          >
            Перейти к записи на курс
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            Назад к курсу
          </Button>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Модуль {moduleId}, Урок {lesson.order}
            </div>
            {lesson.completed && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Завершено
              </div>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${lesson.exercise ? 'lg:grid-cols-2' : ''} gap-8`}>
          <Card className={!lesson.exercise ? 'max-w-4xl mx-auto w-full' : ''}>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
              <p className="text-gray-600 mb-4">{lesson.description}</p>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                </div>
              </div>

              {lesson.examples && lesson.examples.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Примеры</h2>
                  <div className="space-y-4">
                    {lesson.examples.map((example, index) => (
                      <pre
                        key={index}
                        className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm"
                      >
                        <code>{example}</code>
                      </pre>
                    ))}
                  </div>
                </div>
              )}

              {!lesson.exercise && (
                <div className="mt-8 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Завершаем урок...
                      </>
                    ) : lesson.completed ? (
                      'Перейти к следующему уроку'
                    ) : (
                      'Завершить урок'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {lesson.exercise && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Практическое задание
                  </h2>
                  <p className="text-gray-600">{lesson.exercise.description}</p>
                </div>

                {lesson.exercise.hints && lesson.exercise.hints.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Подсказки</h3>
                    <div className="space-y-2">
                      {lesson.exercise.hints.map((hint, index) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-blue-800">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={course?.language?.toLowerCase() || 'python'}
                    height="400px"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Проверяем...
                      </>
                    ) : (
                      'Отправить решение'
                    )}
                  </Button>
                </div>

                {output && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Результаты тестов
                    </h3>
                    <div className="space-y-4">
                      {output.results.map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            result.passed
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-full">
                              <p className="font-medium text-gray-900">
                                Тест {index + 1}: {result.description}
                              </p>
                              <div className="mt-2 space-y-2 text-sm">
                                <div className="flex flex-col space-y-1">
                                  <span className="font-medium text-gray-700">Входные данные:</span>
                                  <code className="bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap">{result.input}</code>
                                </div>
                                {!result.passed && result.output && (
                                  <div className="flex flex-col space-y-1">
                                    <span className="font-medium text-gray-700">Ваш вывод:</span>
                                    <code className="bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap">{result.output}</code>
                                  </div>
                                )}
                                <div className="flex flex-col space-y-1">
                                  <span className="font-medium text-gray-700">Ожидаемый вывод:</span>
                                  <code className="bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap">{result.expectedOutput}</code>
                                </div>
                                {result.error && (
                                  <div className="flex flex-col space-y-1">
                                    <span className="font-medium text-red-700">Ошибка:</span>
                                    <code className="bg-red-100 text-red-800 px-2 py-1 rounded">{result.error}</code>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={`ml-4 flex-shrink-0 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                              {result.passed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <span className="h-5 w-5 flex items-center justify-center rounded-full border-2 border-red-500">
                                  ✕
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;