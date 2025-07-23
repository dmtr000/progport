import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const YANDEX_API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

// Проверка наличия необходимых переменных окружения
if (!YANDEX_API_KEY) {
  console.error('Ошибка: YANDEX_API_KEY не определен');
  process.exit(1);
}

if (!YANDEX_FOLDER_ID) {
  console.error('Ошибка: YANDEX_FOLDER_ID не определен');
  process.exit(1);
}

// Список запрещенных слов и фраз (используется как дополнительная проверка)
const BANNED_WORDS = [
];

// Список подозрительных паттернов
const SUSPICIOUS_PATTERNS = [
  /(?:https?:\/\/[^\s]+)/g, // URL
  /(?:www\.[^\s]+)/g, // www ссылки
  /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, // email
  /(?:[0-9]{10,})/g, // длинные числа (возможно телефон)
];

const MODERATION_PROMPT = `Ты - модератор форума на портале для обучения программированию школьников. Твоя задача - оценить качество и уместность сообщения в контексте обсуждения.

Правила модерации:
1. Запрещено:
   - Оскорбления и грубость
   - Спам и реклама
   - Разжигание ненависти
   - Неприемлемый контент
   - Личные данные

2. Требования к качеству:
   - Минимальная длина: 2 слова
   - Сообщение должно быть понятным
   - Должно вносить вклад в обсуждение
   - Может содержать числа, если они уместны в контексте
   - Может быть кратким, если содержит полезную информацию

3. Примеры допустимых сообщений:
   - "Ответ здесь 123" (если это действительно ответ на вопрос)
   - "Попробуйте вариант 2" (если это рекомендация)
   - "Вот решение: 42" (если это ответ на задачу)
   - "Согласен с предыдущим комментарием"
   - "Спасибо за информацию"

4. Примеры недопустимых сообщений:
   - "123" (без контекста)
   - "Спам спам спам"
   - "Ты дурак"
   - "Купите мой товар"
   - "Мой email: test@test.com"

Если сообщение соответствует правилам, ответь "APPROVED".
Если нарушает правила, ответь "REJECTED:" и укажи причину.

Примеры ответов:
APPROVED
REJECTED: Содержит оскорбления
REJECTED: Содержит рекламу
REJECTED: Содержит личные данные
REJECTED: Сообщение не содержит полезной информации
REJECTED: Сообщение не связано с темой обсуждения`;

export const moderateContent = async (content) => {
  try {
    console.log('Начало модерации контента:', content);

    // Базовая валидация
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.log('Ошибка: пустой контент');
      return {
        approved: false,
        reason: 'Сообщение не может быть пустым'
      };
    }

    if (content.length > 1000) {
      console.log('Ошибка: слишком длинное сообщение');
      return {
        approved: false,
        reason: 'Сообщение слишком длинное (максимум 1000 символов)'
      };
    }

    // Проверка через YandexGPT
    console.log('Отправка запроса к YandexGPT');
    const response = await fetch(YANDEX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_API_KEY}`
      },
      body: JSON.stringify({
        modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.1,
          maxTokens: 100
        },
        messages: [
          {
            role: 'system',
            text: MODERATION_PROMPT
          },
          {
            role: 'user',
            text: content
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка YandexGPT:', errorData);
      
      if (response.status === 401) {
        console.error('Ошибка авторизации YandexGPT. Проверьте API ключ и folder ID');
        return {
          approved: false,
          reason: 'Ошибка авторизации в сервисе модерации'
        };
      }
      
      if (response.status === 429) {
        return {
          approved: false,
          reason: 'Превышен лимит запросов к сервису модерации'
        };
      }
      
      return {
        approved: false,
        reason: 'Ошибка при проверке сообщения'
      };
    }

    const data = await response.json();
    console.log('Ответ YandexGPT:', data);

    const result = data.result.alternatives[0].message.text.trim();
    console.log('Результат модерации:', result);

    if (result === 'APPROVED') {
      return {
        approved: true
      };
    }

    if (result.startsWith('REJECTED:')) {
      return {
        approved: false,
        reason: result.replace('REJECTED:', '').trim()
      };
    }

    // Если ответ не соответствует ожидаемому формату
    console.error('Неожиданный формат ответа:', result);
    return {
      approved: false,
      reason: 'Ошибка при проверке сообщения'
    };

  } catch (error) {
    console.error('Ошибка при модерации:', error);
    return {
      approved: false,
      reason: 'Ошибка при проверке сообщения'
    };
  }
}; 