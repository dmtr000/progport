import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../ui/Button';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthFormLayout } from './AuthFormLayout';
import { FormInput } from './FormInput';
import EmailVerification from './EmailVerification';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Сначала пытаемся войти
      const loginResponse = await api.post('/auth/login', { email, password });
      
      try {
        // Пытаемся выполнить вход с полученным токеном
        await login(loginResponse.data.token);
        navigate(from, { replace: true });
      } catch (loginError: any) {
        // Если при входе получаем ошибку верификации
        if (loginError.response?.status === 403 && loginError.response?.data?.needsVerification) {
          setNeedsVerification(true);
        } else {
          setError(loginError.response?.data?.message || 'Ошибка при входе в систему');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        setNeedsVerification(true);
      } else {
        setError(err.response?.data?.message || 'Неверный email или пароль');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async (token: string) => {
    try {
      await login(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Ошибка при входе после верификации');
      setNeedsVerification(false);
    }
  };

  // Если нужна верификация, показываем форму верификации
  if (needsVerification) {
    return <EmailVerification 
      email={email} 
      onVerificationSuccess={handleVerificationSuccess}
      purpose="registration"
    />;
  }

  return (
    <AuthFormLayout title="Вход в аккаунт">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        
        <div className="space-y-2">
          <FormInput
            id="password"
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          icon={<LogIn className="h-4 w-4" />}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Войти
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default LoginForm;