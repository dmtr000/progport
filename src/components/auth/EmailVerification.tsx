import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../ui/Button';
import { Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthFormLayout } from './AuthFormLayout';
import { FormInput } from './FormInput';
import ResetPasswordForm from './ResetPasswordForm';

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess?: (token: string) => void;
  purpose?: 'registration' | 'reset-password';
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  email, 
  onVerificationSuccess,
  purpose = 'registration'
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (purpose === 'registration') {
        const response = await api.post('/auth/verify-email', {
          email,
          code: verificationCode
        });

        if (onVerificationSuccess) {
          onVerificationSuccess(response.data.token);
        } else {
          await login(response.data.token);
          navigate('/');
        }
      } else {
        // Для сброса пароля
        const response = await api.post('/auth/verify-reset-code', {
          email,
          code: verificationCode
        });

        setResetToken(response.data.resetToken);
        setIsVerified(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при подтверждении кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsResending(true);

    try {
      const endpoint = purpose === 'registration' 
        ? '/auth/resend-verification'
        : '/auth/forgot-password';

      await api.post(endpoint, { email });
      setError('Новый код отправлен на ваш email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке кода');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified && purpose === 'reset-password') {
    return <ResetPasswordForm email={email} resetToken={resetToken} />;
  }

  return (
    <AuthFormLayout title="Подтверждение Email">
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Мы отправили код подтверждения на адрес:
        </p>
        <p className="font-medium text-gray-900">{email}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormInput
          id="verificationCode"
          label="Код подтверждения"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Введите 6-значный код"
          maxLength={6}
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="space-y-3">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            icon={<Check className="h-4 w-4" />}
            isLoading={isLoading}
          >
            Подтвердить
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            icon={<RefreshCw className="h-4 w-4" />}
            isLoading={isResending}
            onClick={handleResendCode}
          >
            Отправить код повторно
          </Button>
        </div>
      </form>
    </AuthFormLayout>
  );
};

export default EmailVerification; 