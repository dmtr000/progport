import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  resendVerificationCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword,
  requestEmailChange,
  verifyCurrentEmail,
  confirmEmailChange,
  resendEmailChangeCode
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { 
  authLimiter, 
  passwordLimiter, 
  emailLimiter 
} from '../middleware/rateLimiter.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Регистрация и аутентификация
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    console.log('User found:', {
      _id: user._id,
      id: user._id.toString(),
      role: user.role
    });

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Generated token payload:', jwt.decode(token));

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Верификация email
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationCode);

// Восстановление пароля
router.post('/forgot-password', passwordLimiter, forgotPassword);
router.post('/verify-reset-code', passwordLimiter, verifyResetCode);
router.post('/reset-password', passwordLimiter, resetPassword);

// Смена пароля
router.post('/change-password', [auth, passwordLimiter], changePassword);

// Смена email
router.post('/request-email-change', [auth, emailLimiter], requestEmailChange);
router.post('/verify-current-email', [auth, emailLimiter], verifyCurrentEmail);
router.post('/confirm-email-change', [auth, emailLimiter], confirmEmailChange);
router.post('/resend-email-change-code', [auth, emailLimiter], resendEmailChangeCode);

// Получение данных текущего пользователя
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -verificationCode -resetPasswordCode')
      .populate('enrolledCourses.courseId')
      .populate('achievements');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Очищаем список курсов от удаленных
    await user.cleanupDeletedCourses();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      enrolledCourses: user.enrolledCourses,
      achievements: user.achievements,
      forumStats: user.forumStats
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка пользователей (только для админа)
router.get('/users', auth, async (req, res) => {
  try {
    // Проверяем, является ли пользователь админом
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Получаем список пользователей
    const users = await User.find()
      .select('-password -verificationCode -resetPasswordCode -emailChangeRequest')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
});

// Изменение роли пользователя (только для админа)
router.patch('/users/:userId/role', auth, async (req, res) => {
  try {
    // Проверяем, является ли пользователь админом
    const admin = await User.findById(req.user.userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { role } = req.body;
    const { userId } = req.params;

    // Проверяем валидность роли
    const validRoles = ['student', 'admin', 'teacher'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    // Находим и обновляем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Запрещаем админу менять свою роль
    if (userId === req.user.userId) {
      return res.status(403).json({ message: 'Нельзя изменить свою роль' });
    }

    user.role = role;
    await user.save();

    res.json({ 
      message: 'Роль пользователя успешно обновлена',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Ошибка при обновлении роли пользователя' });
  }
});

// Изменение статуса пользователя (только для админа)
router.patch('/users/:userId/status', auth, async (req, res) => {
  try {
    // Проверяем, является ли пользователь админом
    const admin = await User.findById(req.user.userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { isActive } = req.body;
    const { userId } = req.params;

    // Находим и обновляем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Запрещаем админу менять свой статус
    if (userId === req.user.userId) {
      return res.status(403).json({ message: 'Нельзя изменить свой статус' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ 
      message: 'Статус пользователя успешно обновлен',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Ошибка при обновлении статуса пользователя' });
  }
});

export default router;