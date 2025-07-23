import React, { useState } from 'react';
import axios from 'axios';
import Button from '../ui/Button';
import { KeyRound } from 'lucide-react';
import { FormInput } from '../auth/FormInput';
import toast from 'react-hot-toast';

const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Проверка совпадения паролей
    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    // Проверка сложности пароля на клиенте
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    const errors = [];
    if (!hasUpperCase) errors.push('заглавную букву');
    if (!hasLowerCase) errors.push('строчную букву');
    if (!hasNumbers) errors.push('цифру');
    if (!hasMinLength) errors.push('минимум 8 символов');

    if (errors.length > 0) {
      setError(`Пароль должен содержать ${errors.join(', ')}`);
      return;
    }

    // Проверка на совпадение со старым паролем
    if (currentPassword === newPassword) {
      setError('Новый пароль должен отличаться от текущего');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending password change request with:', {
        passwordLength: newPassword.length,
        hasUpperCase,
        hasLowerCase,
        hasNumbers
      });

      const response = await axios.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      console.log('Server response:', response.data);

      if (response.data.success) {
        // Очищаем форму
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success(response.data.message || 'Пароль успешно изменен');
      } else {
        throw new Error(response.data.message || 'Произошла ошибка при смене пароля');
      }
    } catch (err: any) {
      console.error('Password change error:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || err.message || 'Произошла ошибка при смене пароля';
      setError(errorMessage);
      toast.error(errorMessage);

      if (err.response?.data?.validationDetails) {
        console.log('Validation details:', err.response.data.validationDetails);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="currentPassword"
        label="Текущий пароль"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <FormInput
        id="newPassword"
        label="Новый пароль"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        helperText="Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и цифры"
      />

      <FormInput
        id="confirmPassword"
        label="Подтверждение нового пароля"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
      />

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        icon={<KeyRound className="h-4 w-4" />}
        isLoading={isLoading}
        disabled={isLoading}
      >
        Изменить пароль
      </Button>
    </form>
  );
};

export default ChangePasswordForm; 