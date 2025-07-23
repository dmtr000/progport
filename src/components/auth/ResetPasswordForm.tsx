import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../ui/Button';
import { KeyRound } from 'lucide-react';
import { AuthFormLayout } from './AuthFormLayout';
import { FormInput } from './FormInput';
import { useAuth } from '../../contexts/AuthContext';

interface ResetPasswordFormProps {
  email: string;
  resetToken: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, resetToken }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword: password
      });

      // После успешного сброса пароля, входим в систему
      await login(response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка при сбросе пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormLayout title="Установка нового пароля">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Введите новый пароль для вашей учетной записи
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormInput
          id="password"
          label="Новый пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <FormInput
          id="confirmPassword"
          label="Подтверждение пароля"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          icon={<KeyRound className="h-4 w-4" />}
          isLoading={isLoading}
        >
          Сохранить новый пароль
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default ResetPasswordForm; 