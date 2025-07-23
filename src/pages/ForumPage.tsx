import React, { useState, useEffect } from 'react';
import ForumTopicCard from '../components/forum/ForumTopicCard';
import Button from '../components/ui/Button';
import { Plus, Loader, Trash2 } from 'lucide-react';
import axios from 'axios';
import { ForumTopic } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ForumPage: React.FC = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tags: '' });
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get('/forum');
        setTopics(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке тем:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту тему?')) {
      return;
    }
    
    try {
      const endpoint = user?.role === 'admin' 
        ? `/forum/${topicId}/moderate`
        : `/forum/${topicId}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Немедленно обновляем состояние после успешного удаления
      setTopics(prevTopics => prevTopics.filter(topic => topic._id !== topicId));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Если тема уже удалена, просто обновляем UI
        setTopics(prevTopics => prevTopics.filter(topic => topic._id !== topicId));
      } else {
        console.error('Ошибка при удалении темы:', error);
        alert('Произошла ошибка при удалении темы');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Вы не авторизованы!');
        return;
      }
      const response = await axios.post(
        '/forum',
        {
          title: newTopic.title,
          content: newTopic.content,
          tags: newTopic.tags ? newTopic.tags.split(',') : [],
          author: user?.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTopics([response.data, ...topics]);
      setShowNewTopicForm(false);
      setNewTopic({ title: '', content: '', tags: '' });
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось создать тему. Проверьте консоль.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Обсуждения на форуме</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Присоединяйтесь к обсуждениям, задавайте вопросы и помогайте другим студентам.</p>
          </div>
          {isAuthenticated && (
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewTopicForm(true)}>
              Новая тема
            </Button>
          )}
        </div>

        {showNewTopicForm && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
            <h2 className="text-xl font-semibold mb-4">Создание новой темы</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Содержание</label>
                  <textarea
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Теги (через запятую)</label>
                  <input
                    type="text"
                    value={newTopic.tags}
                    onChange={(e) => setNewTopic({ ...newTopic, tags: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="python, beginner, help"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setShowNewTopicForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" variant="primary">
                    Создать тему
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <ForumTopicCard 
                key={topic._id} 
                topic={topic} 
                onDelete={
                  (user?.role === 'admin' || 
                  (topic.author && (user?.id === topic.author._id || user?._id === topic.author._id))) 
                  ? handleDeleteTopic 
                  : undefined
                } 
              />
            ))
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500">Тем пока нет. Создайте первое обсуждение!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPage;