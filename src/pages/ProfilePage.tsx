import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/Button';
import { 
  Camera, 
  Save, 
  User, 
  BookOpen, 
  Trophy, 
  MessageCircle, 
  Settings, 
  ChevronRight, 
  LogOut,
} from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import RecentActivity from '../components/dashboard/RecentActivity';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: Date;
  isActive?: boolean;
  isEmailVerified: boolean;
}

interface Stats {
  coursesCompleted: number;
  achievementsCount: number;
  forumReplies: number;
  daysOnPlatform: number;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{user: User,  stats: Stats } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/users/profile');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const stats = profile?.stats || {
    coursesCompleted: 0,
    achievementsCount: 0,
    forumReplies: 0,
    daysOnPlatform: 0,
  };

  const statsData = [
    { label: 'Курсов пройдено', value: stats.coursesCompleted },
    { label: 'Достижений получено', value: stats.achievementsCount },
    { label: 'Ответов на форуме', value: stats.forumReplies },
    { label: 'Дней на платформе', value: stats.daysOnPlatform },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsLoading(true);
      const response = await axios.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (user) {
        updateUser({
          ...user,
          avatar: response.data.avatarUrl
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put('/users/profile', { name });

      if (response.status === 200 && user) {
        updateUser({
          ...user,
          name
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const quickLinks = [
    { 
      icon: <BookOpen className="h-5 w-5" />, 
      title: 'Мои курсы', 
      description: 'Просмотр и продолжение обучения',
      link: '/my-courses',
    },
    { 
      icon: <Trophy className="h-5 w-5" />, 
      title: 'Достижения', 
      description: 'Ваши награды и прогресс',
      link: '/achievements'
    },
    { 
      icon: <MessageCircle className="h-5 w-5" />, 
      title: 'Мои обсуждения', 
      description: 'Ваши темы и ответы на форуме',
      link: '/my-forum-topics'
    },
    { 
      icon: <Settings className="h-5 w-5" />, 
      title: 'Настройки', 
      description: 'Управление аккаунтом и уведомлениями',
      link: '/settings'
    },
    ...(user?.role === 'admin' ? [
      { 
        icon: <Settings className="h-5 w-5" />, 
        title: 'Панель администратора', 
        description: 'Управление пользователями и контентом',
        link: '/admin/users'
      }
    ] : []),
    ...(user?.role === 'teacher' ? [
      { 
        icon: <Settings className="h-5 w-5" />, 
        title: 'Панель учителя', 
        description: 'Управление курсами и студентами',
        link: '/teacher/students'
      }
    ] : [])
  ];

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <img
                        src={user?.avatar || '/default-avatar.png'}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="mt-6 w-full">
                    <div className="mb-4">
                      {isEditing ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Имя
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<User className="h-4 w-4" />}
                            onClick={() => setIsEditing(true)}
                            className="mt-2"
                          >
                            Редактировать
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-gray-600 mb-4">
                      <p>{user?.email}</p>
                      <p className="capitalize mt-1">{user?.role}</p>
                    </div>

                    {isEditing ? (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          className="mr-3"
                          onClick={() => setIsEditing(false)}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="primary"
                          icon={<Save className="h-4 w-4" />}
                          onClick={handleSaveProfile}
                          isLoading={isLoading}
                          disabled={isLoading}
                        >
                          Сохранить
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<LogOut className="h-4 w-4" />}
                        onClick={handleLogout}
                        className="w-full mt-4 text-gray-600 hover:text-red-600"
                      >
                        Выйти из системы
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {statsData.map((stat, index) => (
                        <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">{stat.value}</div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Links and Activity */}
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {/* Quick Links */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickLinks.map((link, index) => (
                      <Link
                        key={index}
                        to={link.link}
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex-shrink-0 mr-4 text-blue-600">
                          {link.icon}
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-medium text-gray-900">{link.title}</h4>
                          <p className="text-sm text-gray-600">{link.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;