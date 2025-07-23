import express from 'express';
import mongoose from 'mongoose';
import { auth, teacherOrAdminAuth } from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

// Получить статистику по упражнениям для учителя
router.get('/teacher/stats', teacherOrAdminAuth, async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.userId });
    const courseIds = courses.map(course => course._id);

    const users = await User.find({
      'enrolledCourses.courseId': { $in: courseIds }
    }).select('name email enrolledCourses');

    const stats = courses.map(course => {
      const courseStats = {
        courseId: course._id,
        courseTitle: course.title,
        totalExercises: 0,
        moduleStats: [],
        studentProgress: []
      };

      // Подсчитываем упражнения по модулям
      course.modules.forEach(module => {
        const moduleExercises = module.lessons.filter(lesson => lesson.exercise).length;
        courseStats.totalExercises += moduleExercises;

        courseStats.moduleStats.push({
          moduleId: module._id,
          moduleTitle: module.title,
          totalExercises: moduleExercises
        });
      });

      // Собираем статистику по студентам
      users.forEach(user => {
        const enrollment = user.enrolledCourses.find(
          e => e.courseId.toString() === course._id.toString()
        );

        if (enrollment) {
          const studentStats = {
            userId: user._id,
            name: user.name,
            email: user.email,
            moduleProgress: enrollment.moduleProgress.map(mp => ({
              moduleId: mp.moduleId,
              exercisesCompleted: mp.exercisesCompleted,
              totalExercises: mp.totalExercises,
              completedExercises: mp.completedLessons
                .filter(lesson => lesson.exerciseCompleted)
                .map(lesson => ({
                  lessonId: lesson.lessonId,
                  completedAt: lesson.exerciseCompletedAt,
                  attempts: lesson.exerciseAttempts
                }))
            }))
          };
          courseStats.studentProgress.push(studentStats);
        }
      });

      return courseStats;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching exercise statistics:', error);
    res.status(500).json({
      message: 'Ошибка при получении статистики упражнений',
      error: error.message
    });
  }
});

// Получить прогресс студента по упражнениям в курсе
router.get('/:courseId/student/progress', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const enrollment = user.enrolledCourses.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Вы не записаны на этот курс' });
    }

    const progress = {
      courseId,
      courseTitle: course.title,
      totalExercises: 0,
      completedExercises: 0,
      moduleProgress: []
    };

    // Собираем статистику по модулям
    course.modules.forEach(module => {
      const moduleProgress = enrollment.moduleProgress.find(
        mp => mp.moduleId.toString() === module._id.toString()
      );

      const moduleStats = {
        moduleId: module._id,
        moduleTitle: module.title,
        totalExercises: module.lessons.filter(lesson => lesson.exercise).length,
        completedExercises: moduleProgress ? moduleProgress.exercisesCompleted : 0,
        exercises: module.lessons
          .filter(lesson => lesson.exercise)
          .map(lesson => {
            const lessonProgress = moduleProgress?.completedLessons.find(
              l => l.lessonId.toString() === lesson._id.toString()
            );

            return {
              lessonId: lesson._id,
              lessonTitle: lesson.title,
              exerciseTitle: lesson.exercise.title,
              completed: lessonProgress?.exerciseCompleted || false,
              completedAt: lessonProgress?.exerciseCompletedAt,
              attempts: lessonProgress?.exerciseAttempts || 0
            };
          })
      };

      progress.totalExercises += moduleStats.totalExercises;
      progress.completedExercises += moduleStats.completedExercises;
      progress.moduleProgress.push(moduleStats);
    });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching student exercise progress:', error);
    res.status(500).json({
      message: 'Ошибка при получении прогресса упражнений',
      error: error.message
    });
  }
});

// Обновить статус выполнения упражнения
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/complete', auth, async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const courseEnrollment = user.enrolledCourses.find(
      e => e.courseId.toString() === courseId
    );
    if (!courseEnrollment) {
      return res.status(404).json({ message: 'Вы не записаны на этот курс' });
    }

    const moduleProgress = courseEnrollment.moduleProgress.find(
      mp => mp.moduleId.toString() === moduleId
    );
    if (!moduleProgress) {
      return res.status(404).json({ message: 'Модуль не найден' });
    }

    // Находим или создаем запись о прогрессе урока
    let lessonProgress = moduleProgress.completedLessons.find(
      l => l.lessonId.toString() === lessonId
    );

    if (!lessonProgress) {
      lessonProgress = {
        lessonId: new mongoose.Types.ObjectId(lessonId),
        completedAt: new Date(),
        exerciseCompleted: true,
        exerciseCompletedAt: new Date(),
        exerciseAttempts: 1
      };
      moduleProgress.completedLessons.push(lessonProgress);
    } else {
      lessonProgress.exerciseCompleted = true;
      lessonProgress.exerciseCompletedAt = new Date();
      lessonProgress.exerciseAttempts += 1;
    }

    // Обновляем счетчик выполненных упражнений в модуле
    moduleProgress.exercisesCompleted = moduleProgress.completedLessons.filter(
      l => l.exerciseCompleted
    ).length;

    await user.save();
    await user.updateCourseProgress(courseId);

    res.json({
      message: 'Упражнение успешно выполнено',
      progress: {
        moduleProgress: moduleProgress,
        lessonProgress: lessonProgress
      }
    });
  } catch (error) {
    console.error('Error completing exercise:', error);
    res.status(500).json({
      message: 'Ошибка при обновлении статуса упражнения',
      error: error.message
    });
  }
});

export default router; 