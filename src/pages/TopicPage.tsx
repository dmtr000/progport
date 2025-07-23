// src/pages/TopicPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ForumTopic, Comment } from '../types';
import CommentForm from '../components/forum/CommentForm';
import CommentList from '../components/forum/CommentList';
import { Eye, MessageSquare } from 'lucide-react';
import Badge from '../components/ui/Badge';

const TopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <div className="p-8 text-center text-red-500">
        Ошибка: ID темы не указан в URL.
      </div>
    );
  }
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);

  // Загружаем тему и увеличиваем просмотры
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await axios.get(`forum/${id}`);
        const topicData = response.data;

        if(!topicData.replies){
          topicData.replies = topicData.comments.length;
        }
        
        setTopic(topicData);
        setComments(topicData.comments);
        await axios.patch(`forum/${id}/views`); // Увеличиваем просмотры
      } catch (error) {
        console.error('Ошибка загрузки темы:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  if (isLoading) return <div>Загрузка...</div>;
  if (!topic) return <div>Тема не найдена</div>;

  const handleCommentAdded = async (replies: number) => {
    // Обновляем тему и комментарии
    const response = await axios.get(`forum/${id}`);
    setTopic(response.data);
    setComments(response.data.comments);
  };

  const handleCommentUpdated = async () => {
    try {
      const response = await axios.get(`forum/${id}`);
      setTopic(response.data);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Ошибка обновления комментариев:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{topic.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-500">
              <Eye className="h-5 w-5 mr-1" />
              <span>{topic.views || 0}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <MessageSquare className="h-5 w-5 mr-1" />
              <span>{topic.replies || 0}</span>
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {topic.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Ответы</h2>
          <CommentForm onCommentAdded={handleCommentAdded} />
          <CommentList 
            comments={comments} 
            topicId={id}
            onCommentUpdated={handleCommentUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default TopicPage;