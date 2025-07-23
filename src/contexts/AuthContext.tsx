import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isEmailVerified: boolean;
  avatar: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Устанавливаем базовый URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Настраиваем перехватчик для добавления токена к каждому запросу
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Настраиваем перехватчик для обработки ошибок авторизации
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если ошибка 401 (неавторизован), очищаем токен и перенаправляем на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Для остальных ошибок (включая 403) просто передаем их дальше
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (newToken?: string) => {
    try {
      if (newToken) {
        localStorage.setItem('token', newToken);
      }
      
      const response = await axios.get('/auth/me');
      setUser({
        ...response.data,
        id: response.data.id
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      // Если ошибка 403 и требуется верификация, пробрасываем ошибку дальше
      if (error.response?.status === 403 && error.response?.data?.needsVerification) {
        localStorage.removeItem('token'); // Удаляем невалидный токен
        throw error; // Пробрасываем ошибку дальше для обработки в компоненте
      }
      
      // Для остальных ошибок выполняем logout
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    try {
      await fetchUserData(token);
    } catch (error: any) {
      // Пробрасываем ошибку дальше для обработки в компоненте
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading,
      login, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};