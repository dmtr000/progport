import React from 'react';
import { MessageCircle, Eye, Clock, Trash2, MessageSquare, User } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { ForumTopic } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface ForumTopicCardProps {
  topic: ForumTopic;
  onDelete?: (topicId: string) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffDay > 0) {
    const lastDigit = diffDay % 10;
    const lastTwoDigits = diffDay % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${diffDay} дней назад`;
    }
    if (lastDigit === 1) {
      return `${diffDay} день назад`;
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${diffDay} дня назад`;
    }
    return `${diffDay} дней назад`;
  }

  if (diffHour > 0) {
    const lastDigit = diffHour % 10;
    const lastTwoDigits = diffHour % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${diffHour} часов назад`;
    }
    if (lastDigit === 1) {
      return `${diffHour} час назад`;
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${diffHour} часа назад`;
    }
    return `${diffHour} часов назад`;
  }

  if (diffMin > 0) {
    const lastDigit = diffMin % 10;
    const lastTwoDigits = diffMin % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${diffMin} минут назад`;
    }
    if (lastDigit === 1) {
      return `${diffMin} минуту назад`;
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${diffMin} минуты назад`;
    }
    return `${diffMin} минут назад`;
  }

  return 'только что';
};

const getViewText = (views: number): string => {
  const lastDigit = views % 10;
  const lastTwoDigits = views % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${views} просмотров`;
  }

  if (lastDigit === 1) {
    return `${views} просмотр`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${views} просмотра`;
  }

  return `${views} просмотров`;
};

const getCommentText = (comments: number): string => {
  const lastDigit = comments % 10;
  const lastTwoDigits = comments % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${comments} комментариев`;
  }

  if (lastDigit === 1) {
    return `${comments} комментарий`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${comments} комментария`;
  }

  return `${comments} комментариев`;
};

const ForumTopicCard: React.FC<ForumTopicCardProps> = ({ topic, onDelete }) => {
  const { user } = useAuth();
  
  // Проверяем наличие необходимых данных
  if (!topic || !topic.author) {
    return null;
  }

  const isAuthor = user?.id === topic.author._id;

  const handleDelete = async () => {
    if (!topic._id) return;
    onDelete?.(topic._id);
  };

  return (
    <Card hoverable className="transition-all duration-200 hover:border-blue-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <img
              src={topic.author.avatar || '/default-avatar.png'}
              alt={topic.author.name || 'User'}
              className="h-8 w-8 rounded-full object-cover mr-3"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{topic.author.name || 'Anonymous'}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(topic.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(topic.tags) && topic.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
            {(isAuthor || onDelete) && topic._id && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                onClick={() => isAuthor ? handleDelete() : onDelete?.(topic._id)}
                className="ml-auto"
              />
            )}
          </div>
        </div>

        <Link to={`/forum/${topic._id}`} className="block mt-4">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {topic.title}
          </h3>
          <p className="mt-2 text-gray-600 line-clamp-2">{topic.content}</p>
        </Link>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            {topic.replies || 0} ответов
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {topic.views || 0} просмотров
          </div>
          {topic.lastReply && (
            <div className="flex items-center ml-auto text-xs">
              <User className="h-3 w-3 mr-1" />
              Последний ответ от {topic.lastReply.author.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumTopicCard;