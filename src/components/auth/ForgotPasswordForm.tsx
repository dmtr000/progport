import React, { useState } from 'react';
import axios from 'axios';
import Button from '../ui/Button';
import { Mail } from 'lucide-react';
import { AuthFormLayout } from './AuthFormLayout';
import { FormInput } from './FormInput';
import EmailVerification from './EmailVerification';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await axios.post('/auth/forgot-password', { email });
      setShowVerification(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка при отправке запроса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setMessage('Email подтвержден. Теперь вы можете установить новый пароль.');
  };

  if (showVerification) {
    return (
      <EmailVerification 
        email={email} 
        onVerificationSuccess={handleVerificationSuccess}
        purpose="reset-password"
      />
    );
  }

  return (
    <AuthFormLayout title="Восстановление пароля">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Введите ваш email для получения кода восстановления
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-600 text-sm">{message}</div>}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          icon={<Mail className="h-4 w-4" />}
          isLoading={isLoading}
        >
          Отправить код
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default ForgotPasswordForm; 