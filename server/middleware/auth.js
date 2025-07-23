import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

export const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token:', token);
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('Auth middleware - Found user:', {
      _id: user._id,
      id: user._id.toString(),
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    });

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    if (!user.isActive || !user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Аккаунт не активирован. Пожалуйста, подтвердите свой email.',
        needsVerification: true
      });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role
    };
    console.log('Auth middleware - Set req.user:', req.user);
    
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    res.status(401).json({ message: 'Ошибка аутентификации' });
  }
};

// Новый middleware для проверки прав учителя или администратора
export const teacherOrAdminAuth = async (req, res, next) => {
  try {
    console.log('TeacherOrAdminAuth middleware - Starting');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('TeacherOrAdminAuth middleware - No token provided');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('TeacherOrAdminAuth middleware - Decoded token:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    console.log('TeacherOrAdminAuth middleware - User role:', user.role);

    if (user.role !== 'admin' && user.role !== 'teacher') {
      console.log('TeacherOrAdminAuth middleware - Access denied: not an admin or teacher');
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права учителя или администратора' });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role
    };
    next();
  } catch (error) {
    console.error('TeacherOrAdminAuth middleware - Error:', error);
    res.status(401).json({ message: 'Ошибка аутентификации' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    console.log('AdminAuth middleware - Starting');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('AdminAuth middleware - No token provided');
      return res.status(401).json({ message: 'Требуется авторизация' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('AdminAuth middleware - Decoded token:', decoded);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      console.log('AdminAuth middleware - User role:', user.role);

      if (user.role !== 'admin') {
        console.log('AdminAuth middleware - Access denied: not an admin');
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
      }

      req.user = {
        userId: user._id.toString(),
        role: user.role
      };
      next();
    } catch (error) {
      console.error('AdminAuth middleware - Token verification error:', error);
      res.status(401).json({ message: 'Недействительный токен' });
    }
  } catch (error) {
    console.error('AdminAuth middleware - General error:', error);
    res.status(401).json({ message: 'Ошибка аутентификации' });
  }
};

