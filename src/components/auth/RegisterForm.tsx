import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../ui/Button';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthFormLayout } from './AuthFormLayout';
import { FormInput } from './FormInput';
import EmailVerification from './EmailVerification';

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/auth/register', {
        name,
        email,
        password
      });

      setShowVerification(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return <EmailVerification email={email} />;
  }

  return (
    <AuthFormLayout title="Регистрация">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormInput
          id="name"
          label="Имя"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <FormInput
          id="password"
          label="Пароль"
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
          icon={<UserPlus className="h-4 w-4" />}
          isLoading={isLoading}
        >
          Зарегистрироваться
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default RegisterForm;