import express from 'express';
import { register, login, verifyEmail, resendVerificationCode } from '../controllers/authController.js';

const router = express.Router();

// Регистрация и аутентификация
router.post('/register', register);
router.post('/login', login);

// Верификация email
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

export default router; 