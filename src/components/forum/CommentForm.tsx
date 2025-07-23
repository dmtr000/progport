import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useParams } from 'react-router-dom';
import { achievementService } from '../../services/achievementService';
import api from '../../api/axios';

interface CommentFormProps {
  onCommentAdded: (replies: number) => void; 
}

interface ModerationError {
  message: string;
  reason: string;
}

const CommentForm: React.FC<CommentFormProps> = ({ onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ModerationError | null>(null);
  const { id: topicId } = useParams<{ id: string }>();

  const apiUrl = `/forum/${topicId}/comments`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post(
        apiUrl,
        { content },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setContent('');
      onCommentAdded(response.data.replies);

      // Получаем обновленную статистику
      const statsResponse = await api.get('/users/stats');
      const { forumPosts } = statsResponse.data;

      // Проверяем достижения
      await achievementService.checkAchievements({
        forumPosts
      });
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 400 && err.response?.data) {
        setError(err.response.data as ModerationError);
      } else {
        setError({ message: 'Ошибка отправки комментария', reason: 'Попробуйте позже' });
      }
      console.error('Ошибка:', err.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Напишите комментарий..."
        required
        disabled={isSubmitting}
      />
      {error && (
        <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error.message}</p>
          {error.reason && (
            <p className="text-red-500 text-sm mt-1">{error.reason}</p>
          )}
        </div>
      )}
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg border-2 border-blue-600 hover:bg-blue-600 disabled:bg-gray-400 disabled:border-gray-400"
        disabled={!content.trim() || isSubmitting}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
};

export default CommentForm;