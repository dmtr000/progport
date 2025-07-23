import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, BookOpen, BarChart, Menu, X } from 'lucide-react';

const AdminNav: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/admin/users',
      label: 'Пользователи',
      icon: Users
    },
    {
      path: '/admin/courses',
      label: 'Курсы',
      icon: BookOpen
    },
    {
      path: '/admin/stats',
      label: 'Статистика',
      icon: BarChart
    }
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Мобильная кнопка меню */}
          <div className="sm:hidden flex items-center justify-between h-14">
            <span className="text-lg font-semibold text-gray-900">Панель управления</span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Десктопное меню */}
          <div className="hidden sm:flex sm:space-x-8 h-16 items-center">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive(item.path)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-2 ${
                  isActive(item.path) ? 'text-blue-600' : 'text-gray-400'
                }`} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Мобильное выпадающее меню */}
          <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg z-50`}>
            <div className="py-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className={`h-5 w-5 mr-3 ${
                      isActive(item.path) ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav; 