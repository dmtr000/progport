import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Card, CardContent } from '../components/ui/card';
import { MessageCircle, MessageSquare, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

interface ForumTopic {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  repliesCount: number;
  lastReply?: {
    author: {
      name: string;
    };
    createdAt: string;
  };
}

interface ForumReply {
  _id: string;
  content: string;
  topicId: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const MyForumTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  
  const [topicsPagination, setTopicsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [repliesPagination, setRepliesPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchUserForumActivity = async (topicsPage = 1, repliesPage = 1) => {
    try {
      const [topicsResponse, repliesResponse] = await Promise.all([
        axios.get(`/forum/my-topics?page=${topicsPage}`),
        axios.get(`/forum/my-replies?page=${repliesPage}`)
      ]);

      console.log('Topics response:', topicsResponse.data);
      console.log('Replies response:', repliesResponse.data);

      setTopics(topicsResponse.data.topics);
      setTopicsPagination(topicsResponse.data.pagination);
      
      setReplies(repliesResponse.data.replies);
      setRepliesPagination(repliesResponse.data.pagination);
    } catch (err) {
      console.error('Ошибка загрузки данных форума:', err);
      setError('Не удалось загрузить ваши обсуждения. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserForumActivity();
  }, []);

  const handleTopicsPageChange = (page: number) => {
    fetchUserForumActivity(page, repliesPagination.currentPage);
  };

  const handleRepliesPageChange = (page: number) => {
    fetchUserForumActivity(topicsPagination.currentPage, page);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const Pagination = ({ pagination, onPageChange }: { pagination: PaginationData, onPageChange: (page: number) => void }) => (
    <div className="flex justify-center items-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.currentPage - 1)}
        disabled={!pagination.hasPrevPage}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-600">
        Страница {pagination.currentPage} из {pagination.totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasNextPage}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Мои обсуждения</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ваши темы и ответы на форуме
          </p>
        </div>

        <div className="grid gap-8">
          {/* Мои темы */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="mr-2 h-6 w-6 text-blue-500" />
              Созданные темы
            </h2>
            {topics.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {topics.map((topic) => (
                    <Card key={topic._id}>
                      <CardContent className="p-6">
                        <Link 
                          to={`/forum/${topic._id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800"
                        >
                          {topic.title}
                        </Link>
                        <p className="text-gray-600 mt-2 line-clamp-2">{topic.content}</p>
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {topic.repliesCount} ответов
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(topic.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Pagination pagination={topicsPagination} onPageChange={handleTopicsPageChange} />
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  У вас пока нет созданных тем
                </CardContent>
              </Card>
            )}
          </div>

          {/* Мои ответы */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-green-500" />
              Мои ответы
            </h2>
            {replies.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {replies.map((reply) => (
                    <Card key={reply._id}>
                      <CardContent className="p-6">
                        <Link 
                          to={`/forum/${reply.topicId._id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800"
                        >
                          {reply.topicId.title}
                        </Link>
                        <p className="text-gray-600 mt-2 line-clamp-2">{reply.content}</p>
                        <div className="flex items-center justify-end mt-4 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(reply.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Pagination pagination={repliesPagination} onPageChange={handleRepliesPageChange} />
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  У вас пока нет ответов в обсуждениях
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyForumTopicsPage; 