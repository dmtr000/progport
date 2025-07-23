import express from 'express';
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import Activity from '../models/Activity.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Получить все достижения с прогрессом пользователя
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ userId: req.user.userId });

    const achievementsWithProgress = achievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId.toString() === achievement._id.toString()
      );

      return {
        ...achievement.toObject(),
        progress: userAchievement ? userAchievement.progress : 0,
        isUnlocked: userAchievement ? userAchievement.progress >= achievement.requirement : false,
        unlockedAt: userAchievement?.unlockedAt
      };
    });

    res.json(achievementsWithProgress);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить прогресс достижения пользователя
router.post('/progress', auth, async (req, res) => {
  try {
    const { achievementId, progress } = req.body;
    const userId = req.user.userId;

    let userAchievement = await UserAchievement.findOne({ userId, achievementId });
    const achievement = await Achievement.findById(achievementId);

    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    if (!userAchievement) {
      userAchievement = new UserAchievement({
        userId,
        achievementId,
        progress
      });
    } else {
      userAchievement.progress = progress;
    }

    // Если достигнут порог - отмечаем время разблокировки
    if (progress >= achievement.requirement && !userAchievement.unlockedAt) {
      userAchievement.unlockedAt = new Date();

      // Создаем запись об активности
      await Activity.create({
        userId,
        type: 'achievement',
        title: `Получено достижение "${achievement.title}"`,
        description: achievement.description,
        entityId: achievement._id,
        timestamp: new Date()
      });
    }

    await userAchievement.save();
    res.json(userAchievement);
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Админские роуты для управления достижениями

// Создать новое достижение
router.post('/', adminAuth, async (req, res) => {
  try {
    const achievement = new Achievement(req.body);
    await achievement.save();
    res.status(201).json(achievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Обновить достижение
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    res.json(achievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Удалить достижение
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }
    // Удаляем также все связанные записи о прогрессе пользователей
    await UserAchievement.deleteMany({ achievementId: req.params.id });
    res.json({ message: 'Достижение удалено' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;