import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import UserAchievement from '../models/UserAchievement.js';
import Achievement from '../models/Achievement.js';
import Activity from '../models/Activity.js';
import { auth, adminAuth } from '../middleware/auth.js';
import Course from '../models/Course.js';
import Exercise from '../models/Exercise.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('enrolledCourses.courseId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Получаем количество разблокированных достижений
    const unlockedAchievements = await UserAchievement.aggregate([
      {
        $match: {
          userId: user._id
        }
      },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievementId',
          foreignField: '_id',
          as: 'achievement'
        }
      },
      {
        $unwind: '$achievement'
      },
      {
        $match: {
          $expr: {
            $gte: ['$progress', '$achievement.requirement']
          }
        }
      }
    ]);

    const stats = {
      coursesCompleted: user.enrolledCourses.filter(course => course.completed).length,
      achievementsCount: unlockedAchievements.length,
      forumReplies: user.forumStats.replies,
      daysOnPlatform: Math.ceil((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    };

    res.json({ user, stats });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  console.log('Request body:', req.user.userId); // Логируем тело запроса
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Не указаны обязательные данные' });
  }

  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Удаляем старый аватар, если он есть
    if (user.avatar) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Сохраняем новый аватар
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({ 
      message: 'Avatar updated successfully',
      avatarUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: avatarUrl
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error); // Логируем ошибку
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats for user:', req.user.userId);

    const user = await User.findById(req.user.userId)
      .populate({
        path: 'enrolledCourses.courseId',
        populate: {
          path: 'modules',
          populate: {
            path: 'lessons'
          }
        }
      });

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Подсчет завершенных курсов
    const coursesCompleted = user.enrolledCourses.filter(
      enrollment => enrollment.completed
    ).length;
    const coursesTotal = user.enrolledCourses.length;

    // Подсчет общего количества упражнений и завершенных упражнений
    let exercisesTotal = 0;
    let exercisesCompleted = 0;

    // Проходим по всем курсам пользователя
    user.enrolledCourses.forEach(enrollment => {
      if (enrollment.courseId && enrollment.courseId.modules) {
        // Проходим по всем модулям курса
        enrollment.courseId.modules.forEach(module => {
          if (module.lessons) {
            // Считаем общее количество упражнений в модуле
            const moduleExercises = module.lessons.filter(lesson => lesson.exercise).length;
            exercisesTotal += moduleExercises;
          }
        });

        // Считаем завершенные упражнения из moduleProgress
        enrollment.moduleProgress.forEach(moduleProgress => {
          const completedExercises = moduleProgress.completedLessons.filter(
            lesson => lesson.exerciseCompleted
          ).length;
          exercisesCompleted += completedExercises;
        });
      }
    });

    console.log('Total exercises found:', exercisesTotal);
    console.log('Completed exercises:', exercisesCompleted);

    // Подсчет комментариев на форуме (только replies)
    const forumComments = user.forumStats ? user.forumStats.replies : 0;
    console.log('Forum comments:', forumComments);

    const stats = {
      coursesCompleted,
      coursesTotal,
      coursesPercentage: coursesTotal > 0 ? Math.round((coursesCompleted / coursesTotal) * 100) : 0,
      exercisesCompleted,
      exercisesTotal,
      exercisesPercentage: exercisesTotal > 0 ? Math.round((exercisesCompleted / exercisesTotal) * 100) : 0,
      forumPosts: forumComments,
      streak: user.streak || 0
    };

    console.log('Calculated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in /stats endpoint:', error);
    res.status(500).json({ 
      message: 'Ошибка сервера при получении статистики',
      error: error.message 
    });
  }
});

// Получить последнюю активность пользователя
router.get('/last-activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ lastActivity: user.lastActivity });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить активность пользователя
router.post('/activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const now = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;

    // Проверяем, была ли активность вчера
    const isYesterday = lastActivity && 
      lastActivity.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    // Обновляем серию, если активность была вчера
    if (isYesterday) {
      user.streak += 1;
    } else if (!lastActivity || lastActivity.toDateString() !== now.toDateString()) {
      // Если не было активности вчера и сегодня еще не было активности,
      // начинаем новую серию
      user.streak = 1;
    }

    user.lastActivity = now;
    await user.save();

    res.json({ 
      lastActivity: user.lastActivity,
      streak: user.streak 
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Тестовый эндпоинт для симуляции активности в прошлом
router.post('/activity/test', auth, async (req, res) => {
  try {
    const { daysAgo } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Устанавливаем дату активности на указанное количество дней назад
    const simulatedDate = new Date();
    simulatedDate.setDate(simulatedDate.getDate() - (daysAgo || 0));
    
    user.lastActivity = simulatedDate;
    await user.save();
    
    res.json({ 
      message: 'Test activity date set',
      lastActivity: user.lastActivity,
      streak: user.streak 
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить последние действия пользователя
router.get('/activities', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получение списка учеников с их статистикой (только для учителей и админов)
router.get('/students', auth, async (req, res) => {
  try {
    // Проверяем роль пользователя
    const teacher = await User.findById(req.user.userId);
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    console.log('Fetching students data...');

    // Получаем всех верифицированных пользователей с ролью student с полной информацией
    const students = await User.find({ 
      role: 'student',
      isEmailVerified: true // Добавляем условие для верифицированных пользователей
    })
      .populate({
        path: 'enrolledCourses.courseId',
        populate: {
          path: 'modules',
          populate: {
            path: 'lessons'
          }
        }
      })
      .lean();

    console.log(`Found ${students.length} verified students`);

    // Получаем активность пользователей за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await Activity.aggregate([
      {
        $match: {
          userId: { $in: students.map(s => s._id) },
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalActivities: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      }
    ]);

    console.log(`Found activities for ${activities.length} students`);

    // Формируем статистику для каждого студента
    const studentsWithStats = students.map((student) => {
      console.log(`Processing student: ${student.name}`);
      
      let totalCompletedLessons = 0;
      let totalCompletedCourses = 0;
      let totalLessons = 0;
      let totalExercisesCompleted = 0;
      let totalExercises = 0;

      // Проходим по каждому курсу студента
      const processedCourses = student.enrolledCourses.map(enrollment => {
        if (!enrollment.courseId || !enrollment.courseId.modules) {
          console.log('Skipping course - no courseId or modules');
          return null;
        }

        let courseCompletedLessons = 0;
        let courseTotalLessons = 0;
        let courseExercises = 0;
        let courseCompletedExercises = 0;

        // Проходим по каждому модулю курса
        enrollment.courseId.modules.forEach(module => {
          if (!module.lessons) return;

          // Считаем общее количество уроков и упражнений в модуле
          courseTotalLessons += module.lessons.length;
          courseExercises += module.lessons.filter(lesson => lesson.exercise).length;

          // Находим прогресс модуля
          const moduleProgress = enrollment.moduleProgress?.find(
            mp => mp.moduleId.toString() === module._id.toString()
          );

          if (moduleProgress) {
            // Считаем завершенные уроки
            courseCompletedLessons += moduleProgress.completedLessons.length;

            // Считаем завершенные упражнения
            courseCompletedExercises += moduleProgress.completedLessons.filter(
              lesson => lesson.exerciseCompleted
            ).length;
          }
        });

        // Обновляем общую статистику
        totalLessons += courseTotalLessons;
        totalCompletedLessons += courseCompletedLessons;
        totalExercises += courseExercises;
        totalExercisesCompleted += courseCompletedExercises;

        // Проверяем завершенность курса
        const isCompleted = enrollment.completed;
        if (isCompleted) {
          totalCompletedCourses++;
        }

        return {
          courseId: enrollment.courseId._id,
          title: enrollment.courseId.title,
          completed: isCompleted,
          progress: {
            lessons: {
              completed: courseCompletedLessons,
              total: courseTotalLessons
            },
            exercises: {
              completed: courseCompletedExercises,
              total: courseExercises
            }
          }
        };
      }).filter(Boolean);

      // Получаем статистику активности студента
      const studentActivity = activities.find(a => a._id.toString() === student._id.toString()) || {
        totalActivities: 0,
        lastActivity: null
      };

      // Вычисляем процент выполнения
      const completionRate = totalLessons > 0 
        ? Math.round((totalCompletedLessons / totalLessons) * 100) 
        : 0;

      const exerciseCompletionRate = totalExercises > 0
        ? Math.round((totalExercisesCompleted / totalExercises) * 100)
        : 0;

      const result = {
        _id: student._id,
        name: student.name,
        email: student.email,
        stats: {
          lessons: {
            completed: totalCompletedLessons,
            total: totalLessons,
            completionRate
          },
          exercises: {
            completed: totalExercisesCompleted,
            total: totalExercises,
            completionRate: exerciseCompletionRate
          },
          courses: {
            completed: totalCompletedCourses,
            total: student.enrolledCourses.length,
            completionRate: student.enrolledCourses.length > 0
              ? Math.round((totalCompletedCourses / student.enrolledCourses.length) * 100)
              : 0
          },
          activity: {
            last30Days: studentActivity.totalActivities,
            lastActive: studentActivity.lastActivity,
            daysInactive: studentActivity.lastActivity 
              ? Math.floor((new Date() - new Date(studentActivity.lastActivity)) / (1000 * 60 * 60 * 24))
              : null
          }
        },
        enrolledCourses: processedCourses
      };

      console.log(`Processed stats for ${student.name}:`, {
        completedLessons: totalCompletedLessons,
        totalLessons,
        completedExercises: totalExercisesCompleted,
        totalExercises,
        completedCourses: totalCompletedCourses
      });

      return result;
    });

    console.log('Successfully processed all students');
    res.json(studentsWithStats);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка учеников' });
  }
});

export default router;