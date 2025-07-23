import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, MessageCircle, Award, Home, LogIn, UserPlus, Settings, User, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  to: string;
  icon?: JSX.Element;
  label: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path.startsWith('/admin') || path.startsWith('/teacher')) {
      return location.pathname.startsWith(path.split('/').slice(0, 2).join('/'));
    }
    return location.pathname === path;
  };

  const mainMenuItems: MenuItem[] = [
    { to: '/', icon: <Home className="h-4 w-4 mr-1" />, label: 'Главная' },
    { to: '/courses', icon: <BookOpen className="h-4 w-4 mr-1" />, label: 'Курсы' },
  ];

  if (isAuthenticated) {
    mainMenuItems.push(
      { to: '/forum', icon: <MessageCircle className="h-4 w-4 mr-1" />, label: 'Форум' },
      { to: '/achievements', icon: <Award className="h-4 w-4 mr-1" />, label: 'Достижения' },
    );
    
    if (user?.role === 'admin') {
      mainMenuItems.push(
        { to: '/admin/users', icon: <Settings className="h-4 w-4 mr-1" />, label: 'Админ панель' }
      );
    } else if (user?.role === 'teacher') {
      mainMenuItems.push(
        { to: '/teacher/students', icon: <Settings className="h-4 w-4 mr-1" />, label: 'Панель учителя' }
      );
    }
  }

  const renderMenuItem = (item: MenuItem, isMobile = false) => (
    <Link
      key={item.to}
      to={item.to}
      onClick={closeMobileMenu}
      className={`${isActivePath(item.to) ? (isMobile ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700' : 'text-gray-900 border-b-2 border-blue-600') : isMobile ? 'border-l-4 border-transparent hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-gray-700' : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'}
        ${isMobile ? 'block pl-3 pr-4 py-2 text-base font-medium' : 'inline-flex items-center px-1 pt-1 text-sm font-medium'}`}
    >
      {!isMobile && item.icon}
      {item.label}
    </Link>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" onClick={closeMobileMenu} className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ProgPort</span>
            </Link>

            <nav className="hidden md:ml-8 md:flex md:space-x-6">
              {mainMenuItems.map((item) => renderMenuItem(item))}
            </nav>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <div className="relative flex-shrink-0" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="bg-white rounded-full flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Открыть меню пользователя</span>
                    <img className="h-8 w-8 rounded-full object-cover" src={user?.avatar} alt={user?.name} />
                  </button>

                  {isDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Ваш профиль
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Настройки
                        </Link>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline" icon={<LogIn className="h-4 w-4" />}>
                    Войти
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" icon={<UserPlus className="h-4 w-4" />}>
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}

            <div className="ml-4 md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Открыть главное меню</span>
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {mainMenuItems.map((item) => renderMenuItem(item, true))}
          </div>

          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <img className="h-10 w-10 rounded-full object-cover" src={user?.avatar} alt={user?.name} />
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link to="/profile" onClick={closeMobileMenu} className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Ваш профиль</Link>
                <Link to="/settings" onClick={closeMobileMenu} className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Настройки</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Выйти</button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-1 px-4">
                <Link to="/login" onClick={closeMobileMenu} className="block text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-4 py-2">Войти</Link>
                <Link to="/register" onClick={closeMobileMenu} className="block text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-4 py-2">Регистрация</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
