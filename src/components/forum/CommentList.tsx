import React, { useState } from 'react';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import axios from 'axios';
import { Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CommentListProps {
  comments: Comment[];
  topicId: string;
  onCommentUpdated: () => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, topicId, onCommentUpdated }) => {
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  console.log('Current user:', user);
  console.log('Comments:', comments);

  const canEditComment = (comment: Comment) => {
    const isAdmin = user?.role === 'admin';
    const isAuthor = comment.author._id === user?.id;
    console.log('Can edit check:', {
      commentAuthorId: comment.author._id,
      userId: user?.id,
      isAdmin,
      isAuthor
    });
    return isAdmin || isAuthor;
  };

  const handleEdit = (comment: Comment) => {
    console.log('Editing comment:', comment);
    console.log('User trying to edit:', user);
    setEditingCommentId(comment._id);
    setEditedContent(comment.content);
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    try {
      const endpoint = user?.role === 'admin' 
        ? `/forum/${topicId}/comments/${commentId}/moderate`
        : `/forum/${topicId}/comments/${commentId}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onCommentUpdated();
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
    }
  };

  const handleSave = async (commentId: string) => {
    try {
      console.log('Saving comment. Token:', localStorage.getItem('token'));
      const response = await axios.put(`/forum/${topicId}/comments/${commentId}`, { content: editedContent }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Save response:', response.data);
      setEditingCommentId(null);
      onCommentUpdated();
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment._id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-start">
              <img
                src={comment.author.avatar || '/default-avatar.png'}
                alt={comment.author.name}
                className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="ml-3">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                  <span className="font-medium text-gray-900">{comment.author.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                {editingCommentId === comment._id ? (
                  <div className="mt-2">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleSave(comment._id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </div>
            {canEditComment(comment) && !editingCommentId && (
              <div className="flex items-center space-x-2 sm:ml-4">
                <button
                  onClick={() => handleEdit(comment)}
                  className="p-1 text-gray-500 hover:text-blue-600 rounded border-2 border-gray-200 hover:border-blue-600"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="p-1 text-gray-500 hover:text-red-600 rounded border-2 border-gray-200 hover:border-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <div className="text-center py-8 border-2 border-gray-200 rounded-lg bg-white">
          <p className="text-gray-500">Пока нет комментариев. Будьте первым!</p>
        </div>
      )}
    </div>
  );
};

export default CommentList;