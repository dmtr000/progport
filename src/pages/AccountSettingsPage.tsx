import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordForm from '../components/settings/ChangePasswordForm';
import ChangeEmailForm from '../components/settings/ChangeEmailForm';
import SettingsSection from '../components/settings/SettingsSection';
import { Settings, User, Mail, KeyRound } from 'lucide-react';

const AccountSettingsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Настройки аккаунта</h1>
      </div>

      <div className="grid gap-8">
        {/* Основная информация */}
        <div className="bg-white shadow-lg rounded-xl border-2 border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Основная информация</h2>
          </div>
          
          <div className="grid gap-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <p className="text-gray-900 font-medium">{user.name}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль
              </label>
              <p className="text-gray-900 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Секция смены email */}
        <SettingsSection
          title="Email адрес"
          description="Изменение адреса электронной почты с подтверждением"
          icon={<Mail className="h-5 w-5 text-blue-600" />}
          buttonText="Изменить email"
        >
          <ChangeEmailForm />
        </SettingsSection>

        {/* Секция смены пароля */}
        <SettingsSection
          title="Пароль"
          description="Изменение пароля для входа в аккаунт"
          icon={<KeyRound className="h-5 w-5 text-blue-600" />}
          buttonText="Изменить пароль"
        >
          <ChangePasswordForm />
        </SettingsSection>
      </div>
    </div>
  );
};

export default AccountSettingsPage; 