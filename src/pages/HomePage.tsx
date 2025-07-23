import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseList from '../components/courses/CourseList';
import ForumTopicCard from '../components/forum/ForumTopicCard';
import ProgressStats from '../components/dashboard/ProgressStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import AchievementCard from '../components/dashboard/AchievementCard';
import Button from '../components/ui/Button';
import { Sparkles, Rocket, BookOpen, Lightbulb, ArrowRight } from 'lucide-react';
import { ForumTopic, Course } from '../types';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { achievementService, Achievement } from '../services/achievementService';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const continueLearningSectionRef = useRef<HTMLElement>(null);

  const [latestTopics, setLatestTopics] = useState<ForumTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  // Загружаем курсы из базы вместо мок-данных
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/courses');
        // Проверяем и фильтруем курсы с обязательными полями
        const validCourses = response.data
          .filter((course: Course) => course && (course._id || course.id))
          .map((course: Course) => ({
            ...course,
            enrolled: course.enrolled || 0,
            modules: course.modules || [],
            lessons: course.lessons || 0
          }))
          .sort((a: Course, b: Course) => (b.enrolled || 0) - (a.enrolled || 0));
        
        setCourses(validCourses);
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Загружаем записанные курсы пользователя
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await axios.get('/auth/me');
        const userEnrolledCourses = response.data.enrolledCourses || [];
        
        // Преобразуем данные курсов
        const coursesWithProgress = userEnrolledCourses
          .filter((enrollment: any) => enrollment && enrollment.courseId)
          .map((enrollment: any) => ({
            ...enrollment.courseId,
            progress: enrollment.progress || 0,
            isEnrolled: true,
            startDate: enrollment.startDate,
            lastAccessDate: enrollment.lastAccessDate,
            completed: enrollment.completed,
            moduleProgress: enrollment.moduleProgress || [],
            enrolled: enrollment.courseId?.enrolled || 0,
            modules: enrollment.courseId?.modules || [],
            lessons: enrollment.courseId?.lessons || 0
          }));

        // Сортируем по прогрессу (незавершенные первыми)
        const sortedCourses = coursesWithProgress.sort((a: any, b: any) => {
          if (a.progress === 100 && b.progress !== 100) return 1;
          if (a.progress !== 100 && b.progress === 100) return -1;
          return b.progress - a.progress;
        });

        setEnrolledCourses(sortedCourses);
      } catch (error) {
        console.error('Ошибка загрузки записанных курсов:', error);
      }
    };

    fetchEnrolledCourses();
  }, [isAuthenticated]);


  useEffect(() => {
    const fetchLatestTopics = async () => {
      if (isAuthenticated) {
        try {
          const response = await axios.get('/forum');
          // Проверяем и фильтруем темы, у которых есть все необходимые данные
          const validTopics = response.data.filter((topic: ForumTopic) => 
            topic && 
            topic._id &&
            topic.author && 
            topic.author._id &&
            topic.author.name &&
            topic.title &&
            Array.isArray(topic.tags)
          );
          setLatestTopics(validTopics);
        } catch (error) {
          console.error('Ошибка загрузки последних тем:', error);
          setLatestTopics([]); // Устанавливаем пустой массив в случае ошибки
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchLatestTopics();
  }, [isAuthenticated]);

  // Add new useEffect for achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      if (isAuthenticated) {
        try {
          const data = await achievementService.getUserAchievements();
          setAchievements(data);
        } catch (error) {
          console.error('Ошибка загрузки достижений:', error);
        } finally {
          setIsLoadingAchievements(false);
        }
      }
    };

    fetchAchievements();
  }, [isAuthenticated]);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      const navHeight = 80; // Примерная высота навигационного меню
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      navigate('/register');
      window.scrollTo(0, 0);
    } else if (enrolledCourses.length > 0 && continueLearningSectionRef.current) {
      scrollToSection(continueLearningSectionRef);
    } else {
      navigate('/courses');
      window.scrollTo(0, 0);
    }
  };

  const handleViewCourses = () => {
    navigate('/courses');
    window.scrollTo(0, 0);
  };

  const handleViewForum = () => {
    navigate('/forum');
    window.scrollTo(0, 0);
  };

  return (
    <>
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Учитесь программировать с интерактивными уроками
              </h1>
              <p className="text-xl md:text-2xl leading-relaxed text-blue-100">
                Осваивайте языки программирования и создавайте реальные проекты с помощью курсов для всех уровней подготовки.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  variant="secondary"
                  icon={<Rocket className="h-5 w-5" />}
                  onClick={handleStartLearning}
                >
                  {isAuthenticated ? 'Продолжить обучение' : 'Начать обучение'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={handleViewCourses}
                >
                  Просмотреть курсы
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute -left-16 -top-16 w-32 h-32 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-purple-400 rounded-full opacity-20 animate-pulse delay-700"></div>
              <img
                src="https://new.dop.mosreg.ru/images/events/cover/8b8bba3e6097b4f4da678bb3efd6678d_big.png"
                alt="Студент программирует"
                className="rounded-lg shadow-2xl relative z-10"
              />
            </div>
          </div>
        </div>
      </section>
      {isAuthenticated && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ваш прогресс обучения</h2>
            <ProgressStats />
          </div>
        </section>
      )}
      {isAuthenticated && enrolledCourses.length > 0 && (
        <section ref={continueLearningSectionRef} className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Продолжить обучение</h2>
              <Button
                variant="ghost"
                iconPosition="right"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={handleViewCourses}
              >
                Все курсы
              </Button>
            </div>
            <CourseList courses={enrolledCourses} />
          </div>
        </section>
      )}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Почему стоит учиться на ProgPort?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Наша платформа сочетает структурированные курсы, интерактивные упражнения и поддержку сообщества для ускорения вашего обучения.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Структурированная программа</h3>
              <p className="text-gray-600">
                Обучайтесь пошагово с тщательно разработанными курсами для начинающих, продолжающих и продвинутых программистов.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Интерактивное программирование</h3>
              <p className="text-gray-600">
                Практикуйтесь с мгновенной обратной связью в наших упражнениях и проектах для закрепления знаний.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Поддержка сообщества</h3>
              <p className="text-gray-600">
                Получайте помощь от преподавателей и других студентов на нашем форуме и в совместных проектах.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Популярные курсы</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Изучите наши самые популярные курсы программирования для разных уровней подготовки
            </p>
          </div>
          <CourseList 
            courses={courses.slice(0, 4)} 
            gridClasses="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            isPopular={true}
          />
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={handleViewCourses}
              className="inline-flex items-center"
            >
              Смотреть все курсы
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      {isAuthenticated && (
        <section className="py-12 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Последние обсуждения</h2>
                  <Button
                    variant="ghost"
                    iconPosition="right"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={handleViewForum}
                  >
                    Все темы
                  </Button>
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <div>Загрузка тем...</div>
                  ) : latestTopics.length > 0 ? (
                    latestTopics.slice(0, 3).map((topic) => (
                      <ForumTopicCard key={topic._id} topic={topic} />
                    ))
                  ) : (
                    <p className="text-gray-600">Нет последних обсуждений</p>
                  )}
                </div>
              </div>
              <div>
                <RecentActivity />
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">Ваши достижения</h2>
                <div className="space-y-4">
                  {isLoadingAchievements ? (
                    <div>Загрузка достижений...</div>
                  ) : achievements.length > 0 ? (
                    achievements
                      .sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0))
                      .slice(0, 3)
                      .map((achievement) => (
                        <AchievementCard key={achievement._id} achievement={achievement} />
                      ))
                  ) : (
                    <p className="text-gray-600">Нет доступных достижений</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Готовы начать свой путь в программировании?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Присоединяйтесь к тысячам студентов, которые уже учатся программировать на нашей платформе и развивают навыки для своего будущего.
            </p>
            <Button
              size="lg"
              variant="secondary"
              icon={<Rocket className="h-5 w-5" />}
              onClick={() => navigate('/register')}
            >
              Создать бесплатный аккаунт
            </Button>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;