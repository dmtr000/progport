import { achievementService } from '../../services/achievementService';

const CreateTopicForm: React.FC<CreateTopicFormProps> = ({ onSuccess }) => {
  // ... existing code ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post('/forum', {
        title,
        content,
        tags
      });

      // Получаем обновленную статистику форума
      const statsResponse = await axios.get('/users/stats');
      const { forumPosts } = statsResponse.data;

      // Проверяем достижения
      await achievementService.checkAchievements({
        forumPosts
      });

      onSuccess?.();
      // ... rest of success handling ...
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('Ошибка при создании темы');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component code ...
} 