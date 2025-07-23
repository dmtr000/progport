import React, { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import Button from '../ui/Button';
import { Mail, RefreshCw } from 'lucide-react';
import { FormInput } from '../auth/FormInput';
import toast from 'react-hot-toast';
import { useAuth, AuthContextType } from '../../contexts/AuthContext';

type VerificationStep = 'initial' | 'verify_current' | 'verify_new';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

const ChangeEmailForm: React.FC = () => {
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<VerificationStep>('initial');
  const [resendTimer, setResendTimer] = useState(0);
  const { user, updateUser } = useAuth() as AuthContextType;

  useEffect(() => {
    let timer: number;
    if (resendTimer > 0) {
      timer = window.setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [resendTimer]);

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newEmail) {
      setError('Введите новый email');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Requesting email change:', { newEmail });
      const response = await axios.post('/auth/request-email-change', { newEmail });
      console.log('Request response:', response.data);
      
      setCurrentStep('verify_current');
      setResendTimer(60);
      toast.success('Код подтверждения отправлен на текущий email');
    } catch (err: any) {
      console.error('Request error:', err.response?.data);
      setError(err.response?.data?.message || 'Произошла ошибка при запросе смены email');
      toast.error('Ошибка при запросе смены email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/resend-email-change-code', { newEmail });
      setResendTimer(60);
      toast.success('Новый код подтверждения отправлен');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка при отправке нового кода');
      toast.error('Ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('Введите код подтверждения');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending verification code:', {
        code: verificationCode,
        newEmail
      });

      const response = await axios.post('/auth/verify-current-email', { 
        code: verificationCode,
        newEmail
      });

      console.log('Verification response:', response.data);

      setCurrentStep('verify_new');
      setVerificationCode('');
      setResendTimer(60);
      toast.success('Код подтверждения отправлен на новый email');
    } catch (err: any) {
      console.error('Verification error:', err.response?.data);
      setError(err.response?.data?.message || 'Произошла ошибка при подтверждении текущего email');
      toast.error(err.response?.data?.message || 'Ошибка при подтверждении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('Введите код подтверждения');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Confirming email change:', {
        code: verificationCode,
        newEmail
      });

      const response = await axios.post('/auth/confirm-email-change', { 
        code: verificationCode,
        newEmail
      });

      console.log('Confirmation response:', response.data);

      if (response.data.user && user) {
        updateUser({
          ...user,
          ...response.data.user
        });
        
        setCurrentStep('initial');
        setNewEmail('');
        setVerificationCode('');
        setResendTimer(0);
        setError('');

        toast.success(response.data.message || 'Email успешно изменен');
      }
    } catch (err: any) {
      console.error('Confirmation error:', err.response?.data);
      
      if (err.response?.status === 404 && err.response?.data?.message?.includes('Не найден активный запрос')) {
        setCurrentStep('initial');
        setNewEmail('');
        setVerificationCode('');
        setResendTimer(0);
        setError('');
        toast.success('Email успешно изменен');
        return;
      }

      setError(err.response?.data?.message || 'Произошла ошибка при подтверждении смены email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentStep('initial');
    setNewEmail('');
    setVerificationCode('');
    setError('');
    setResendTimer(0);
  };

  const renderResendButton = () => {
    if (currentStep === 'initial') return null;

    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleResendCode}
        disabled={resendTimer > 0 || isLoading}
        icon={<RefreshCw className={`h-4 w-4 ${resendTimer > 0 ? 'opacity-50' : ''}`} />}
      >
        {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : 'Отправить код повторно'}
      </Button>
    );
  };

  const renderForm = () => {
    switch (currentStep) {
      case 'verify_current':
        return (
          <form onSubmit={handleVerifyCurrent} className="space-y-4">
            <p className="text-sm text-gray-600">
              Для подтверждения смены email, введите код, отправленный на текущий адрес: <span className="font-medium">{user?.email}</span>
            </p>
            <FormInput
              id="verificationCode"
              label="Код подтверждения"
              type="text"
              value={verificationCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
            />

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex space-x-4">
              <Button
                type="submit"
                variant="primary"
                icon={<Mail className="h-4 w-4" />}
                isLoading={isLoading}
              >
                Подтвердить
              </Button>
              {renderResendButton()}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Отмена
              </Button>
            </div>
          </form>
        );

      case 'verify_new':
        return (
          <form onSubmit={handleConfirmChange} className="space-y-4">
            <p className="text-sm text-gray-600">
              Введите код подтверждения, отправленный на новый адрес: <span className="font-medium">{newEmail}</span>
            </p>
            <FormInput
              id="verificationCode"
              label="Код подтверждения"
              type="text"
              value={verificationCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
            />

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex space-x-4">
              <Button
                type="submit"
                variant="primary"
                icon={<Mail className="h-4 w-4" />}
                isLoading={isLoading}
              >
                Подтвердить
              </Button>
              {renderResendButton()}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Отмена
              </Button>
            </div>
          </form>
        );

      default:
        return (
          <form onSubmit={handleRequestChange} className="space-y-4">
            <div className="text-sm text-gray-600">
              Текущий email: <span className="font-medium text-gray-900">{user?.email}</span>
            </div>

            <FormInput
              id="newEmail"
              label="Новый email"
              type="email"
              value={newEmail}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
            />

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button
              type="submit"
              variant="primary"
              icon={<Mail className="h-4 w-4" />}
              isLoading={isLoading}
            >
              Отправить код подтверждения
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderForm()}
    </div>
  );
};

export default ChangeEmailForm; 