import rateLimit from 'express-rate-limit';

// Общий лимитер для всех запросов
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // Лимит 100 запросов с одного IP
});

// Лимитер для смены пароля
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // Лимит 10 запросов с одного IP
  message: {
    success: false,
    message: 'Слишком много попыток смены пароля. Пожалуйста, попробуйте позже.'
  }
});

// Лимитер для операций с email
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5, // Лимит 5 запросов с одного IP
  message: {
    success: false,
    message: 'Слишком много попыток изменения email. Пожалуйста, попробуйте через час.'
  }
});

// Лимитер для аутентификации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // Лимит 5 неудачных попыток
  skipSuccessfulRequests: true, // Пропускаем успешные запросы
  message: {
    success: false,
    message: 'Слишком много неудачных попыток. Пожалуйста, попробуйте позже.'
  }
}); 