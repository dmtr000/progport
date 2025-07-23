import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateVerificationCode, sendVerificationEmail } from '../services/emailService.js';
import bcrypt from 'bcrypt';
import Activity from '../models/Activity.js';
import dotenv from 'dotenv';
dotenv.config();

// Регистрация пользователя
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Генерируем код подтверждения
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Создаем нового пользователя
    const user = new User({
      name,
      email,
      password,
      isEmailVerified: false,
      isActive: false, // Пользователь неактивен до подтверждения email
      verificationCode: {
        code: verificationCode,
        expiresAt: verificationExpires
      }
    });

    await user.save();

    // Отправляем код подтверждения на email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Пользователь успешно зарегистрирован. Проверьте email для подтверждения.',
      needsVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
};

// Подтверждение email
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем код и его срок действия
    if (!user.verificationCode || 
        user.verificationCode.code !== code || 
        user.verificationCode.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Неверный или просроченный код подтверждения' });
    }

    // Подтверждаем email и активируем пользователя
    user.isEmailVerified = true;
    user.isActive = true; // Активируем пользователя после подтверждения email
    user.verificationCode = undefined;
    await user.save();

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Email успешно подтвержден',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Ошибка при подтверждении email' });
  }
};

// Повторная отправка кода подтверждения
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email уже подтвержден' });
    }

    // Генерируем новый код
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = {
      code: verificationCode,
      expiresAt: verificationExpires
    };
    await user.save();

    // Отправляем новый код
    await sendVerificationEmail(email, verificationCode);

    res.json({ message: 'Новый код подтверждения отправлен на email' });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({ message: 'Ошибка при отправке кода подтверждения' });
  }
};

// Вход в систему
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Сначала проверяем подтверждение email и активацию аккаунта
    if (!user.isEmailVerified || !user.isActive) {
      // Проверяем пароль перед отправкой формы верификации
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      // Если пароль верный, но email не подтвержден
      return res.status(403).json({ 
        message: 'Аккаунт не активирован. Пожалуйста, подтвердите свой email.',
        needsVerification: true,
        email: user.email
      });
    }

    // Проверяем пароль только если email подтвержден
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Создаем токен только если все проверки пройдены
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка при входе в систему' });
  }
};

// Запрос на сброс пароля
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
    }

    // Генерируем код подтверждения
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    user.resetPasswordCode = {
      code: verificationCode,
      expiresAt: verificationExpires
    };
    await user.save();

    // Отправляем код на email
    await sendVerificationEmail(email, verificationCode, 'reset');

    res.json({ message: 'Код для сброса пароля отправлен на email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Ошибка при обработке запроса на сброс пароля' });
  }
};

// Проверка кода для сброса пароля
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!user.resetPasswordCode || 
        user.resetPasswordCode.code !== code || 
        user.resetPasswordCode.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Неверный или просроченный код' });
    }

    // Генерируем временный токен для сброса пароля
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    res.json({ resetToken });
  } catch (error) {
    console.error('Reset code verification error:', error);
    res.status(500).json({ message: 'Ошибка при проверке кода' });
  }
};

// Установка нового пароля
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Проверяем токен
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ message: 'Недействительный токен сброса пароля' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(401).json({ message: 'Недействительный токен сброса пароля' });
    }

    const user = await User.findOne({ 
      _id: decoded.userId,
      email 
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Устанавливаем новый пароль
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    await user.save();

    // Создаем новый токен авторизации
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Пароль успешно изменен',
      token
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Ошибка при сбросе пароля' });
  }
};

// Смена пароля
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    console.log('Debug - Password validation:');
    console.log('Password length:', newPassword.length);
    
    // Проверяем сложность нового пароля
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    console.log('Validation results:', {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasMinLength,
      passwordLength: newPassword.length
    });

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasMinLength) {
      const errors = [];
      if (!hasUpperCase) errors.push('заглавную букву');
      if (!hasLowerCase) errors.push('строчную букву');
      if (!hasNumbers) errors.push('цифру');
      if (!hasMinLength) errors.push('минимум 8 символов');

      console.log('Validation failed. Missing requirements:', errors);

      return res.status(400).json({ 
        success: false,
        message: `Пароль должен содержать ${errors.join(', ')}`,
        validationDetails: {
          hasUpperCase,
          hasLowerCase,
          hasNumbers,
          hasMinLength,
          passwordLength: newPassword.length
        }
      });
    }

    console.log('Password validation passed, proceeding with user lookup');

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем текущий пароль
    const isMatch = await user.comparePassword(currentPassword);
    console.log('Current password check:', isMatch ? 'passed' : 'failed');
    
    if (!isMatch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(400).json({ 
        success: false,
        message: 'Неверный текущий пароль' 
      });
    }

    // Проверяем, не совпадает ли новый пароль со старым
    const isSamePassword = await user.comparePassword(newPassword);
    console.log('New password same as current:', isSamePassword ? 'yes' : 'no');
    
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Новый пароль должен отличаться от текущего' 
      });
    }

    // Сохраняем текущий пароль в историю
    if (!user.previousPasswords) {
      user.previousPasswords = [];
    }
    user.previousPasswords.push({
      hash: user.password,
      changedAt: new Date()
    });

    // Ограничиваем историю последними 5 паролями
    if (user.previousPasswords.length > 5) {
      user.previousPasswords = user.previousPasswords.slice(-5);
    }

    // Устанавливаем новый пароль
    user.password = newPassword;
    await user.save();

    console.log('Password successfully changed for user:', userId);

    // Отправляем успешный ответ
    res.json({ 
      success: true,
      message: 'Пароль успешно изменен' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка при смене пароля',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Запрос на смену email - первый этап (подтверждение текущего email)
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, не занят ли новый email
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Этот email уже используется' });
    }

    // Проверяем, не совпадает ли новый email с текущим
    if (user.email === newEmail) {
      return res.status(400).json({ message: 'Новый email совпадает с текущим' });
    }

    // Генерируем код подтверждения для текущего email
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Сохраняем запрос на смену email
    user.emailChangeRequest = {
      newEmail,
      currentEmailCode: verificationCode,
      newEmailCode: null,
      expiresAt: verificationExpires,
      step: 'verify_current',
      lastCodeSentAt: new Date()
    };
    await user.save();

    console.log('Email change request saved:', {
      userId: user._id,
      currentEmail: user.email,
      newEmail,
      code: verificationCode,
      step: 'verify_current'
    });

    // Отправляем код на текущий email
    await sendVerificationEmail(
      user.email, 
      verificationCode, 
      'change_current',
      { newEmail }
    );

    res.json({ 
      message: 'Код подтверждения отправлен на текущий email',
      step: 'verify_current'
    });
  } catch (error) {
    console.error('Email change request error:', error);
    res.status(500).json({ message: 'Ошибка при обработке запроса на смену email' });
  }
};

// Повторная отправка кода для смены email
export const resendEmailChangeCode = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!user.emailChangeRequest || user.emailChangeRequest.newEmail !== newEmail) {
      return res.status(400).json({ message: 'Не найден активный запрос на смену email' });
    }

    // Проверяем, прошла ли минута с последней отправки
    const lastSentTime = user.emailChangeRequest.lastCodeSentAt;
    if (lastSentTime && (Date.now() - lastSentTime.getTime()) < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - lastSentTime.getTime())) / 1000);
      return res.status(400).json({ 
        message: `Пожалуйста, подождите ${waitTime} секунд перед повторной отправкой` 
      });
    }

    // Генерируем новый код
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Обновляем код в зависимости от текущего этапа
    if (user.emailChangeRequest.step === 'verify_current') {
      user.emailChangeRequest.currentEmailCode = verificationCode;
      await sendVerificationEmail(
        user.email,
        verificationCode,
        'change_current',
        { newEmail }
      );
    } else if (user.emailChangeRequest.step === 'verify_new') {
      user.emailChangeRequest.newEmailCode = verificationCode;
      await sendVerificationEmail(
        newEmail,
        verificationCode,
        'change_new',
        { currentEmail: user.email }
      );
    }

    user.emailChangeRequest.expiresAt = verificationExpires;
    user.emailChangeRequest.lastCodeSentAt = new Date();
    await user.save();

    res.json({ 
      message: 'Новый код подтверждения отправлен',
      step: user.emailChangeRequest.step
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ message: 'Ошибка при отправке нового кода' });
  }
};

// Подтверждение текущего email и отправка кода на новый
export const verifyCurrentEmail = async (req, res) => {
  try {
    const { code, newEmail } = req.body;
    const userId = req.user.userId;

    console.log('Verifying current email:', {
      userId,
      code,
      newEmail
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    console.log('Current email change request:', user.emailChangeRequest);

    // Проверяем существование запроса
    if (!user.emailChangeRequest) {
      return res.status(400).json({ message: 'Не найден активный запрос на смену email' });
    }

    // Проверяем соответствие email
    if (user.emailChangeRequest.newEmail !== newEmail) {
      return res.status(400).json({ message: 'Указанный email не соответствует запросу' });
    }

    // Проверяем этап верификации
    if (user.emailChangeRequest.step !== 'verify_current') {
      return res.status(400).json({ message: 'Неверный этап верификации' });
    }

    // Проверяем код и срок его действия
    if (user.emailChangeRequest.currentEmailCode !== code) {
      return res.status(400).json({ message: 'Неверный код подтверждения' });
    }

    if (user.emailChangeRequest.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Срок действия кода истек' });
    }

    // Генерируем новый код для подтверждения нового email
    const newEmailCode = generateVerificationCode();
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Обновляем запрос
    user.emailChangeRequest = {
      ...user.emailChangeRequest,
      newEmailCode,
      expiresAt: newExpiresAt,
      step: 'verify_new',
      lastCodeSentAt: new Date()
    };
    await user.save();

    console.log('Email change request updated:', {
      userId: user._id,
      newEmail,
      step: 'verify_new'
    });

    // Отправляем код на новый email
    await sendVerificationEmail(
      newEmail, 
      newEmailCode, 
      'change_new',
      { currentEmail: user.email }
    );

    res.json({ 
      message: 'Код подтверждения отправлен на новый email',
      step: 'verify_new'
    });
  } catch (error) {
    console.error('Current email verification error:', error);
    res.status(500).json({ message: 'Ошибка при подтверждении текущего email' });
  }
};

// Подтверждение нового email и завершение процесса
export const confirmEmailChange = async (req, res) => {
  try {
    const { code, newEmail } = req.body;
    const userId = req.user.userId;

    console.log('Confirming email change:', {
      userId,
      code,
      newEmail
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    console.log('Current email change request:', user.emailChangeRequest);

    // Проверяем существование запроса
    if (!user.emailChangeRequest) {
      return res.status(400).json({ message: 'Не найден активный запрос на смену email' });
    }

    // Проверяем соответствие email
    if (user.emailChangeRequest.newEmail !== newEmail) {
      return res.status(400).json({ message: 'Указанный email не соответствует запросу' });
    }

    // Проверяем этап верификации
    if (user.emailChangeRequest.step !== 'verify_new') {
      return res.status(400).json({ message: 'Неверный этап верификации' });
    }

    // Проверяем код и срок его действия
    if (user.emailChangeRequest.newEmailCode !== code) {
      return res.status(400).json({ message: 'Неверный код подтверждения' });
    }

    if (user.emailChangeRequest.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Срок действия кода истек' });
    }

    // Проверяем, не занят ли новый email другим пользователем
    const existingUser = await User.findOne({ 
      _id: { $ne: userId }, // Исключаем текущего пользователя
      email: newEmail 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Этот email уже используется другим пользователем' });
    }

    console.log('Email change validation passed, updating user email');

    // Сохраняем старый email для логов
    const oldEmail = user.email;

    // Меняем email
    user.email = newEmail;
    user.emailChangeRequest = undefined;
    await user.save();

    console.log('Email successfully changed:', {
      userId: user._id,
      oldEmail,
      newEmail: user.email
    });

    res.json({ 
      message: 'Email успешно изменен',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('Email change confirmation error:', error);
    res.status(500).json({ message: 'Ошибка при подтверждении смены email' });
  }
}; 