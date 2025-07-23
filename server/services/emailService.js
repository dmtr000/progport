import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

// Создаем транспорт для отправки email через Mail.ru
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true, // true для 465 порта
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS
  }
});

// Проверяем подключение
transporter.verify(function(error, success) {
  if (error) {
    console.error('Ошибка при проверке транспорта:', error);
  } else {
    console.log('Сервер готов к отправке сообщений');
  }
});

// Генерация случайного кода подтверждения
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Отправка кода подтверждения на email
export const sendVerificationEmail = async (email, code, type = 'registration', data = {}) => {
  try {
    console.log('=== Начало процесса отправки email ===');
    console.log('Отправка на email:', email);
    console.log('Код подтверждения:', code);
    console.log('Тип письма:', type);

    let subject, text, html;

    switch (type) {
      case 'reset':
        subject = 'Восстановление пароля в ProgPort';
        text = `Ваш код для восстановления пароля: ${code}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Восстановление пароля в ProgPort</h2>
            <p>Для сброса пароля, пожалуйста, введите следующий код:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h1>
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">С уважением,<br>Команда ProgPort</p>
          </div>
        `;
        break;

      case 'change_current':
        subject = 'Подтверждение смены email в ProgPort';
        text = `Ваш код для подтверждения смены email: ${code}. Новый email: ${data.newEmail}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Подтверждение смены email в ProgPort</h2>
            <p>Мы получили запрос на смену адреса электронной почты на: <strong>${data.newEmail}</strong></p>
            <p>Для подтверждения этого действия, пожалуйста, введите следующий код:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h1>
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не запрашивали смену email, немедленно смените пароль от вашего аккаунта.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">С уважением,<br>Команда ProgPort</p>
          </div>
        `;
        break;

      case 'change_new':
        subject = 'Завершение смены email в ProgPort';
        text = `Ваш код для подтверждения нового email: ${code}. Текущий email: ${data.currentEmail}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Завершение смены email в ProgPort</h2>
            <p>Вы успешно подтвердили запрос на смену email с адреса: <strong>${data.currentEmail}</strong></p>
            <p>Для завершения процесса и активации нового адреса, введите следующий код:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h1>
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>После подтверждения этот email станет основным для вашего аккаунта.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">С уважением,<br>Команда ProgPort</p>
          </div>
        `;
        break;

      default: // registration
        subject = 'Подтверждение регистрации в ProgPort';
        text = `Ваш код подтверждения: ${code}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Добро пожаловать в ProgPort!</h2>
            <p>Для завершения регистрации, пожалуйста, введите следующий код подтверждения:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h1>
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">С уважением,<br>Команда ProgPort</p>
          </div>
        `;
    }

    const mailOptions = {
      from: {
        name: 'ProgPort',
        address: 'progportverify@mail.ru'
      },
      to: email,
      subject,
      text,
      html
    };

    console.log('Подготовленные опции письма:', {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject
    });

    console.log('Попытка отправки email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('=== Результат отправки ===');
    console.log('ID сообщения:', info.messageId);
    console.log('Ответ сервера:', info.response);
    console.log('Email успешно отправлен');
    
    return true;
  } catch (error) {
    console.error('=== Ошибка при отправке email ===');
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение ошибки:', error.message);
    if (error.response) {
      console.error('Детали ошибки:', error.response);
    }
    throw error;
  }
}; 