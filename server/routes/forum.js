import express from 'express';
import ForumTopic from '../models/ForumTopic.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import Activity from '../models/Activity.js';
import mongoose from 'mongoose';
import { moderateContent } from '../services/moderationService.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const router = express.Router();

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await ForumTopic.find()
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's topics
router.get('/my-topics', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const topics = await ForumTopic.find({ author: req.user.userId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Добавляем количество ответов для каждой темы
    const topicsWithReplies = topics.map(topic => {
      const topicObj = topic.toObject();
      topicObj.repliesCount = topic.comments ? topic.comments.length : 0;
      return topicObj;
    });

    const total = await ForumTopic.countDocuments({ author: req.user.userId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      topics: topicsWithReplies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user topics:', error);
    res.status(500).json({ message: 'Ошибка при получении тем пользователя' });
  }
});

// Get user's replies
router.get('/my-replies', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const replies = await ForumTopic.aggregate([
      // Разворачиваем массив комментариев
      { $unwind: '$comments' },
      
      // Фильтруем комментарии текущего пользователя
      {
        $match: {
          'comments.author': new mongoose.Types.ObjectId(req.user.userId)
        }
      },
      
      // Формируем нужную структуру ответа
      {
        $project: {
          _id: '$comments._id',
          content: '$comments.content',
          createdAt: '$comments.createdAt',
          'topicId._id': '$_id',
          'topicId.title': '$title'
        }
      },
      
      // Сортируем по дате (новые первыми)
      { $sort: { createdAt: -1 } },
      
      // Добавляем фасет для подсчета общего количества
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    const data = replies[0].data;
    const total = replies[0].total[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      replies: data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in /my-replies:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении ответов пользователя',
      error: error.message 
    });
  }
});

// Create new topic
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    
    // Проверяем контент через модерацию
    const moderationResult = await moderateContent(content);
    if (!moderationResult.approved) {
      return res.status(400).json({ 
        message: 'Содержимое темы нарушает правила форума',
        reason: moderationResult.reason
      });
    }

    const topic = new ForumTopic({
      title,
      content,
      author: req.user.userId,
      tags
    });

    await topic.save();
    
    const populatedTopic = await topic
      .populate('author', 'name avatar');

    // Update user's forum stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'forumStats.topics': 1 }
    });

    // Создаем запись об активности
    await Activity.create({
      userId: req.user.userId,
      type: 'forum',
      title: `Создана новая тема "${title}"`,
      entityId: topic._id,
      timestamp: new Date()
    });

    res.status(201).json(populatedTopic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete topic
router.delete('/:id', auth, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }

    // Check if user is the author
    if (topic.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Нет прав для удаления этой темы' });
    }

    await topic.deleteOne();
    res.json({ message: 'Тема успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Mark comment as answer
router.put('/:topicId/comments/:commentId/mark-answer', auth, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const comment = topic.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (topic.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const wasAnswer = comment.isAnswer;
    comment.isAnswer = !comment.isAnswer;
    await topic.save();

    // Update helpful answers count for comment author
    if (comment.isAnswer && !wasAnswer) {
      await User.findByIdAndUpdate(comment.author, {
        $inc: { 'forumStats.helpfulAnswers': 1 }
      });
    } else if (!comment.isAnswer && wasAnswer) {
      await User.findByIdAndUpdate(comment.author, {
        $inc: { 'forumStats.helpfulAnswers': -1 }
      });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Просмотр темы + увеличение просмотров
router.get('/:id', async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    topic.replies = topic.comments.length;
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Увеличение просмотров
router.patch('/:id/views', async (req, res) => {
  try {
    const topic = await ForumTopic.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 0.5 } },
      { new: true }
    );
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка постов
router.get('/posts', async (req, res) => {
  try {
    console.log('Получение списка постов');
    const posts = await Post.find()
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 });

    console.log(`Найдено постов: ${posts.length}`);
    res.json(posts);
  } catch (error) {
    console.error('Ошибка при получении списка постов:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка постов',
      error: error.message 
    });
  }
});

// Получение поста по ID
router.get('/posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    console.log('Поиск поста с ID:', postId);

    const post = await Post.findById(postId)
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!post) {
      console.log('Пост не найден');
      return res.status(404).json({ 
        message: 'Пост не найден',
        postId: postId
      });
    }

    console.log('Пост найден');
    res.json(post);
  } catch (error) {
    console.error('Ошибка при получении поста:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении поста',
      error: error.message,
      postId: req.params.postId
    });
  }
});

// Добавление комментария к теме
router.post('/:topicId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const topicId = req.params.topicId;
    const userId = req.user.userId;

    console.log('Получен запрос на добавление комментария:', {
      topicId,
      content,
      userId
    });

    if (!content || content.trim().length === 0) {
      console.log('Ошибка: пустой комментарий');
      return res.status(400).json({ message: 'Комментарий не может быть пустым' });
    }

    // Проверка модерации
    console.log('Начало проверки модерации');
    const moderationResult = await moderateContent(content);
    console.log('Результат модерации:', moderationResult);

    if (!moderationResult.approved) {
      console.log('Комментарий отклонен модерацией:', moderationResult.reason);
      return res.status(400).json({ 
        message: 'Комментарий нарушает правила форума',
        reason: moderationResult.reason
      });
    }

    // Проверяем существование темы
    console.log('Поиск темы с ID:', topicId);
    const topic = await ForumTopic.findById(topicId);
    console.log('Результат поиска темы:', topic ? 'найдена' : 'не найдена');

    if (!topic) {
      console.log('Ошибка: тема не найдена');
      return res.status(404).json({ 
        message: 'Тема не найдена',
        topicId: topicId
      });
    }

    // Добавляем комментарий к теме
    console.log('Добавление комментария к теме');
    topic.comments.push({
      content,
      author: userId,
      createdAt: new Date()
    });

    // Обновляем счетчик комментариев
    topic.replies = topic.comments.length;

    // Сохраняем тему
    console.log('Сохранение темы с новым комментарием');
    await topic.save();

    // Загружаем данные автора для комментария
    console.log('Загрузка данных автора для комментария');
    const populatedTopic = await ForumTopic.findById(topicId)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');

    const newComment = populatedTopic.comments[populatedTopic.comments.length - 1];

    console.log('Комментарий успешно добавлен');
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    res.status(500).json({ 
      message: 'Ошибка при добавлении комментария',
      error: error.message,
      topicId: req.params.topicId
    });
  }
});

// Удаление комментария
router.delete('/:topicId/comments/:commentId', auth, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Тема не найдена' });

    const comment = topic.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Комментарий не найден' });

    // Проверяем, что автор комментария = текущему пользователю
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    // Удаляем комментарий
    topic.comments.pull(req.params.commentId);

    // Уменьшаем счетчик комментариев
    topic.replies = topic.comments.length;

    await topic.save();

    res.json({ message: 'Комментарий удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление комментария
router.put('/:topicId/comments/:commentId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const topic = await ForumTopic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }

    const comment = topic.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    // Проверка прав (автор или админ могут редактировать)
    const isAdmin = req.user.role === 'admin';
    const isAuthor = comment.author.toString() === req.user.userId;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    // Обновление содержимого
    comment.content = content;
    await topic.save();

    // Возвращаем обновленный комментарий с данными автора
    const updatedTopic = await ForumTopic.findById(req.params.topicId)
      .populate('comments.author', 'name avatar');
    const updatedComment = updatedTopic.comments.id(req.params.commentId);

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

//админ

router.delete('/:id/moderate', adminAuth, async (req, res) => {
  try {
    const topic = await ForumTopic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    const isAdmin = req.user.role === 'admin';
    const isAuthor = topic.author.toString() === req.user.userId;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ 
        message: 'Недостаточно прав. Только администратор или автор могут удалять темы' 
      });
    }
    
    await topic.deleteOne();

    await User.findByIdAndUpdate(topic.author, {
      $inc: { 'forumStats.topics': -1 }
    });

    res.json({ message: 'Тема удалена администратором' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:topicId/comments/:commentId/moderate', adminAuth, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Тема не найдена' });
    }
    
    topic.comments.pull(req.params.commentId);
    // Обновляем счетчик комментариев
    topic.replies = topic.comments.length;
    await topic.save();
    
    res.json({ 
      message: 'Комментарий удален администратором',
      replies: topic.replies 
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;