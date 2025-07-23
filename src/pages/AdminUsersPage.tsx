import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          console.log('Decoded token data:', tokenData);
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }

      if (!token) {
        setError('Токен авторизации отсутствует');
        setLoading(false);
        return;
      }

      if (user?.role !== 'admin') {
        setError('Недостаточно прав для доступа к этой странице');
        setLoading(false);
        return;
      }

      console.log('Current axios headers:', axios.defaults.headers.common);

      const response = await axios.get('/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Current admin ID:', user?.id, user?._id);
      console.log('Received users data:', response.data);
      
      // Проверяем, что у текущего пользователя есть хотя бы один из идентификаторов
      if (!user?.id && !user?._id) {
        console.error('Current user has no ID');
        setUsers(response.data);
        return;
      }

      // Фильтруем список пользователей, исключая текущего администратора
      const currentUserId = user.id || user._id;
      const filteredUsers = response.data.filter((u: User) => {
        const userId = u.id || u._id;
        console.log('Comparing user:', userId, 'with current admin:', currentUserId);
        return userId !== currentUserId;
      });
      
      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке пользователей');
      
      if (err.response) {
        console.log('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    try {
      console.log('Changing role for user:', userId, 'to:', newRole);
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`/auth/users/${userId}/role`, 
        { role: newRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);

      setUsers(prevUsers => prevUsers.map(user => 
        user._id === userId ? { ...user, role: response.data.user.role } : user
      ));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при изменении роли пользователя');
      console.error('Error updating user role:', err);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`/auth/users/${userId}/status`, 
        { isActive },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: response.data.user.isActive } : user
      ));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при изменении статуса пользователя');
      console.error('Error updating user status:', err);
    }
  };

  // Не позволяем администратору менять свою роль или блокировать себя
  const isCurrentUser = (userId: string) => user?._id === userId;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Управление пользователями</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Desktop view */}
      <div className="hidden sm:block">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={userItem.avatar || '/default-avatar.png'}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="text-sm text-gray-900 border rounded p-1"
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem._id, e.target.value as 'student' | 'teacher' | 'admin')}
                    >
                      <option value="student">Ученик</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        userItem.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {userItem.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        userItem.isActive
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      onClick={() => handleStatusChange(userItem._id, !userItem.isActive)}
                    >
                      {userItem.isActive ? 'Заблокировать' : 'Активировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden space-y-4">
        {users.map((userItem) => (
          <div key={userItem._id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={userItem.avatar || '/default-avatar.png'}
                  alt=""
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                  <div className="text-sm text-gray-500">{userItem.email}</div>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  userItem.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {userItem.isActive ? 'Активен' : 'Заблокирован'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Роль</label>
                <select
                  className="text-sm text-gray-900 border rounded p-2 bg-gray-50"
                  value={userItem.role}
                  onChange={(e) => handleRoleChange(userItem._id, e.target.value as 'student' | 'teacher' | 'admin')}
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              
              <button
                className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                  userItem.isActive
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
                onClick={() => handleStatusChange(userItem._id, !userItem.isActive)}
              >
                {userItem.isActive ? 'Заблокировать' : 'Активировать'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;