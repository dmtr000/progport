import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Course } from '../types';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  usersByRole: {
    student: number;
    teacher: number;
    admin: number;
  };
  coursesByLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

const AdminStatsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Токен авторизации отсутствует');
        setLoading(false);
        return;
      }

      const [usersResponse, coursesResponse] = await Promise.all([
        axios.get('/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get('/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const users = usersResponse.data;
      const courses = coursesResponse.data;

      const stats: Stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        totalCourses: courses.length,
        totalEnrollments: courses.reduce((sum, course) => sum + (course.enrolled || 0), 0),
        usersByRole: {
          student: users.filter(user => user.role === 'student').length,
          teacher: users.filter(user => user.role === 'teacher').length,
          admin: users.filter(user => user.role === 'admin').length
        },
        coursesByLevel: {
          beginner: courses.filter(course => course.level === 'beginner').length,
          intermediate: courses.filter(course => course.level === 'intermediate').length,
          advanced: courses.filter(course => course.level === 'advanced').length
        }
      };

      setStats(stats);
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке статистики');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Статистика платформы</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Всего пользователей</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Активных пользователей</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Всего курсов</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalCourses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Всего записей на курсы</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.totalEnrollments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Пользователи по ролям</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Студенты</span>
              <span className="font-semibold">{stats.usersByRole.student}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Преподаватели</span>
              <span className="font-semibold">{stats.usersByRole.teacher}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Администраторы</span>
              <span className="font-semibold">{stats.usersByRole.admin}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Курсы по уровням</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Начинающий</span>
              <span className="font-semibold">{stats.coursesByLevel.beginner}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Средний</span>
              <span className="font-semibold">{stats.coursesByLevel.intermediate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Продвинутый</span>
              <span className="font-semibold">{stats.coursesByLevel.advanced}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage; 