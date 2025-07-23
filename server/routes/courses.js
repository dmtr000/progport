import express from 'express';
import Course from '../models/Course.js';
import mongoose from 'mongoose';
import { auth, teacherOrAdminAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import codeRunner from '../utils/codeRunner.js';
import User from '../models/User.js';
import UserAchievement from '../models/UserAchievement.js';
import Achievement from '../models/Achievement.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// Получить все курсы (без деталей уроков)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .select('title description level language imageUrl duration enrolled modules createdBy')
      .populate('createdBy', 'name email')
      .lean();
      
    // Добавляем вычисляемые поля
    const coursesWithStats = courses.map(course => ({
      ...course,
      modules: course.modules?.length || 0,
      lessons: course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
    }));
    
    res.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении курсов',
      error: error.message 
    });
  }
});

// Получить курсы учителя - этот маршрут должен быть перед маршрутами с параметрами
router.get('/teacher', teacherOrAdminAuth, async (req, res) => {
  try {
    console.log('Teacher courses request - User:', req.user);

    // Получаем все курсы для учителя
    const courses = await Course.find()
      .select('title description level language imageUrl duration enrolled modules createdBy')
      .populate('createdBy', 'name email')
      .lean();

    console.log('Found courses:', courses);

    // Добавляем статистику по каждому курсу и флаг владения
    const coursesWithStats = courses.map(course => ({
      ...course,
      totalModules: course.modules?.length || 0,
      totalLessons: course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0,
      isOwner: course.createdBy?._id.toString() === req.user.userId
    }));

    res.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ message: 'Ошибка при получении курсов', error: error.message });
  }
});

// Создать новый курс (для учителей и админов)
router.post('/', teacherOrAdminAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Course creation - Request headers:', req.headers);
    console.log('Course creation - User:', req.user);
    console.log('Course creation - File:', req.file);
    console.log('Course creation - Body:', req.body);

    let courseData;
    try {
      courseData = JSON.parse(req.body.courseData);
      console.log('Course creation - Parsed course data:', courseData);
    } catch (parseError) {
      console.error('Course creation - Error parsing course data:', parseError);
      return res.status(400).json({ 
        message: 'Ошибка при создании курса', 
        error: 'Некорректный формат данных курса' 
      });
    }

    // Проверяем обязательные поля
    const requiredFields = ['title', 'description', 'level', 'language', 'duration'];
    const missingFields = requiredFields.filter(field => !courseData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Ошибка при создании курса',
        error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
      });
    }

    // Проверяем корректность уровня сложности
    if (!['beginner', 'intermediate', 'advanced'].includes(courseData.level)) {
      return res.status(400).json({
        message: 'Ошибка при создании курса',
        error: 'Некорректный уровень сложности'
      });
    }

    // Добавляем путь к загруженному изображению и ID создателя
    courseData.imageUrl = req.file ? `/uploads/courses/${req.file.filename}` : '/default-course-image.jpg';
    courseData.createdBy = req.user.userId;
    
    // Инициализируем пустой массив модулей, если он не предоставлен
    courseData.modules = courseData.modules || [];
    
    // Проверяем и устанавливаем порядок модулей и уроков
    courseData.modules = courseData.modules.map((module, moduleIndex) => ({
      ...module,
      order: moduleIndex + 1,
      lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
        ...lesson,
        order: lessonIndex + 1
      }))
    }));

    const course = new Course(courseData);
    await course.save();
    
    const savedCourse = await Course.findById(course._id)
      .populate('createdBy', 'name email')
      .lean();

    console.log('Course creation - Course saved successfully:', savedCourse);
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Course creation - Error:', error);
    res.status(400).json({ 
      message: 'Ошибка при создании курса', 
      error: error.message || 'Неизвестная ошибка' 
    });
  }
});

// Все остальные маршруты с параметрами должны быть после специфических маршрутов

// Получить детали курса
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный ID курса' });
    }

    // Проверяем, является ли пользователь администратором или учителем
    const isAdminOrTeacher = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');

    // Для админов и учителей возвращаем полные данные, для остальных скрываем expectedOutput
    const course = await Course.findById(req.params.id)
      .select(isAdminOrTeacher ? '' : '-modules.lessons.exercise.testCases.expectedOutput')
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Добавляем _id для модулей и уроков
    course.modules = course.modules?.map(module => ({
      _id: module._id?.toString(),
      ...module,
      lessons: module.lessons?.map(lesson => ({
        _id: lesson._id?.toString(),
        ...lesson,
        exercise: lesson.exercise ? {
          ...lesson.exercise,
          testCases: lesson.exercise.testCases?.map(testCase => ({
            ...testCase,
            _id: testCase._id?.toString()
          })) || []
        } : undefined
      })) || []
    })) || [];

    // Добавляем статистику по курсу
    const courseWithStats = {
      ...course,
      totalModules: course.modules.length,
      totalLessons: course.modules.reduce((total, module) => total + module.lessons.length, 0)
    };

    res.json(courseWithStats);
    
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении курса',
      error: error.message 
    });
  }
});

// Получить конкретный урок
router.get('/:courseId/modules/:moduleId/lessons/:lessonId',  async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(courseId) || 
        !mongoose.Types.ObjectId.isValid(moduleId) || 
        !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Некорректный ID' });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Модуль не найден' });
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Создаем копию урока с _id
    const lessonResponse = {
      _id: lesson._id.toString(),
      ...lesson.toObject(),
      moduleId: module._id.toString(), // Добавляем moduleId для удобства
      courseId: course._id.toString()  // Добавляем courseId для удобства
    };

    res.json(lessonResponse);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении урока',
      error: error.message 
    });
  }
});

// Отправить решение упражнения
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/submit', auth, async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const { code, isTheoryOnly } = req.body;
    const userId = req.user.userId;

    console.log('Exercise submission:', {
      courseId,
      moduleId,
      lessonId,
      userId,
      isTheoryOnly
    });

    // Находим курс для получения языка программирования
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Находим пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Если это теоретический урок, просто отмечаем его как завершенный
    if (isTheoryOnly) {
      const result = await handleLessonCompletion(course, moduleId, lessonId, userId);
      return res.json(result);
    }

    // Находим модуль и урок
    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Модуль не найден' });
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson || !lesson.exercise) {
      return res.status(404).json({ message: 'Урок или упражнение не найдены' });
    }

    // Проверяем решение
    const results = await codeRunner.validateTestCases(code, course.language, lesson.exercise.testCases);
    const allTestsPassed = results.every(result => result.passed);

    console.log('Test results:', {
      allTestsPassed,
      results: results.map(r => ({ passed: r.passed }))
    });

    // Если все тесты пройдены, отмечаем урок как завершенный
    let completionResult = null;
    if (allTestsPassed) {
      // Находим запись о прохождении курса
      const enrollment = user.enrolledCourses.find(
        e => e.courseId.toString() === courseId
      );

      // Находим прогресс модуля
      const moduleProgress = enrollment.moduleProgress.find(
        mp => mp.moduleId.toString() === moduleId
      );

      // Находим или создаем запись о завершенном уроке
      let completedLesson = moduleProgress.completedLessons.find(
        l => l.lessonId.toString() === lessonId
      );

      if (!completedLesson) {
        completedLesson = {
          lessonId,
          completedAt: new Date(),
          exerciseCompleted: true,
          exerciseCompletedAt: new Date(),
          exerciseAttempts: 1
        };
        moduleProgress.completedLessons.push(completedLesson);
      } else {
        completedLesson.exerciseCompleted = true;
        completedLesson.exerciseCompletedAt = new Date();
        completedLesson.exerciseAttempts += 1;
      }

      console.log('Updated lesson completion:', {
        lessonId,
        exerciseCompleted: completedLesson.exerciseCompleted,
        attempts: completedLesson.exerciseAttempts
      });

      // Обновляем статистику упражнений в модуле
      moduleProgress.exercisesCompleted = moduleProgress.completedLessons.filter(
        l => l.exerciseCompleted
      ).length;

      await user.save();
      
      completionResult = await handleLessonCompletion(course, moduleId, lessonId, userId);
    }

    res.json({
      success: allTestsPassed,
      results,
      lessonCompleted: allTestsPassed,
      progress: completionResult ? completionResult.progress : null,
      moduleCompleted: completionResult ? completionResult.moduleCompleted : false,
      courseCompleted: completionResult ? completionResult.courseCompleted : false,
      navigation: completionResult ? completionResult.navigation : null
    });

  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ 
      message: 'Ошибка при проверке решения',
      error: error.message 
    });
  }
});

//админ

router.put('/:id', teacherOrAdminAuth, upload.single('image'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем права на редактирование
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'У вас нет прав на редактирование этого курса' });
    }

    let courseData;
    try {
      courseData = JSON.parse(req.body.courseData);
    } catch (parseError) {
      courseData = req.body;
    }

    // Если загружено новое изображение, обновляем путь
    if (req.file) {
      courseData.imageUrl = `/uploads/courses/${req.file.filename}`;
    }

    // Обновляем порядок модулей и уроков
    if (courseData.modules) {
      courseData.modules = courseData.modules.map((module, moduleIndex) => ({
        ...module,
        order: moduleIndex + 1,
        lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
          ...lesson,
          order: lessonIndex + 1
        }))
      }));
    }
    
    // Сохраняем оригинального создателя
    courseData.createdBy = course.createdBy;

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      courseData,
      { new: true }
    ).populate('createdBy', 'name email');

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({ 
      message: 'Ошибка при обновлении курса', 
      error: error.message 
    });
  }
});

router.delete('/:id', teacherOrAdminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем права на удаление
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'У вас нет прав на удаление этого курса' });
  }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Курс успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/:id/modules', teacherOrAdminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }
    
    course.modules.push(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при добавлении модуля', error });
  }
});

// Записаться на курс
router.post('/:courseId/enroll', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Проверяем валидность ID курса
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Некорректный ID курса' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем, не записан ли уже пользователь на курс
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.courseId && enrollment.courseId.toString() === courseId
    );

    if (isEnrolled) {
      return res.status(400).json({ message: 'Вы уже записаны на этот курс' });
    }

    // Создаем начальную структуру прогресса для каждого модуля
    const moduleProgress = course.modules.map(module => ({
      moduleId: module._id,
      completedLessons: [],
      completed: false,
      exercisesCompleted: 0,
      totalExercises: module.lessons.filter(lesson => lesson.exercise).length
    }));

    // Добавляем курс в список записанных
    user.enrolledCourses.push({
      courseId,
      progress: 0,
      startDate: new Date(),
      lastAccessDate: new Date(),
      completed: false,
      moduleProgress
    });

    // Увеличиваем счетчик записанных студентов в курсе
    course.enrolled = (course.enrolled || 0) + 1;

    await Promise.all([user.save(), course.save()]);

    res.json({ 
      message: 'Вы успешно записались на курс',
      enrollment: user.enrolledCourses[user.enrolledCourses.length - 1]
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Ошибка при записи на курс' });
  }
});

// Получить прогресс пользователя по курсу
router.get('/:courseId/progress', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    console.log('Fetching progress for course:', courseId, 'user:', userId);

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Некорректный ID курса' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const enrollment = user.enrolledCourses.find(
      course => course.courseId.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Вы не записаны на этот курс' });
    }

    // Получаем курс для подсчета общего количества упражнений
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    console.log('Course modules:', course.modules.map(m => ({
      moduleId: m._id,
      lessonsWithExercises: m.lessons.filter(l => l.exercise).length
    })));

    // Подсчитываем статистику упражнений для каждого модуля
    enrollment.moduleProgress.forEach(moduleProgress => {
      const completedExercisesInModule = moduleProgress.completedLessons.filter(
        lesson => lesson.exerciseCompleted
      ).length;

      // Находим соответствующий модуль в курсе
      const courseModule = course.modules.find(
        m => m._id.toString() === moduleProgress.moduleId.toString()
      );

      console.log('Module progress:', {
        moduleId: moduleProgress.moduleId,
        completedLessons: moduleProgress.completedLessons.map(l => ({
          lessonId: l.lessonId,
          exerciseCompleted: l.exerciseCompleted
        })),
        completedExercises: completedExercisesInModule
      });

      if (courseModule) {
        // Обновляем общее количество упражнений
        const totalExercisesInModule = courseModule.lessons.filter(
          lesson => lesson.exercise
        ).length;
        moduleProgress.totalExercises = totalExercisesInModule;
        moduleProgress.exercisesCompleted = completedExercisesInModule;

        console.log('Module stats updated:', {
          moduleId: moduleProgress.moduleId,
          totalExercises: totalExercisesInModule,
          completedExercises: completedExercisesInModule
        });
      }
    });

    // Подсчитываем общую статистику по упражнениям
    const totalExercises = course.modules.reduce((sum, module) => {
      const exercisesInModule = module.lessons.filter(lesson => lesson.exercise).length;
      console.log('Module exercises:', {
        moduleId: module._id,
        exercises: exercisesInModule
      });
      return sum + exercisesInModule;
    }, 0);
    
    const completedExercises = enrollment.moduleProgress.reduce((sum, module) => {
      const completedInModule = module.completedLessons.filter(
        lesson => lesson.exerciseCompleted
      ).length;
      console.log('Completed exercises in module:', {
        moduleId: module.moduleId,
        completed: completedInModule
      });
      return sum + completedInModule;
    }, 0);

    console.log('Final exercise stats:', {
      totalExercises,
      completedExercises
    });

    // Сохраняем обновленные данные
    await user.save();

    // Формируем ответ с обновленной статистикой
    const response = {
      ...enrollment.toObject(),
      exerciseStats: {
        completed: completedExercises,
        total: totalExercises
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении прогресса',
      error: error.message 
    });
  }
});

// Обновить прогресс урока
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/progress', auth, async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(courseId) || 
        !mongoose.Types.ObjectId.isValid(moduleId) || 
        !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Некорректный ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const courseEnrollment = user.enrolledCourses.find(
      course => course.courseId.toString() === courseId
    );

    if (!courseEnrollment) {
      return res.status(404).json({ message: 'Вы не записаны на этот курс' });
    }

    const moduleProgress = courseEnrollment.moduleProgress.find(
      mp => mp.moduleId.toString() === moduleId
    );

    if (!moduleProgress) {
      return res.status(404).json({ message: 'Модуль не найден в прогрессе' });
    }

    // Проверяем, не отмечен ли уже урок как завершенный
    const lessonCompleted = moduleProgress.completedLessons.some(
      lesson => lesson.lessonId.toString() === lessonId
    );

    if (!lessonCompleted) {
      moduleProgress.completedLessons.push({
        lessonId,
        completedAt: new Date()
      });

      // Проверяем, завершен ли модуль
      const course = await Course.findById(courseId);
      const module = course.modules.id(moduleId);
      if (moduleProgress.completedLessons.length === module.lessons.length) {
        moduleProgress.completed = true;
      }

      // Обновляем общий прогресс курса
      await user.updateCourseProgress(courseId);
      
      // Если курс завершен, проверяем достижения
      const coursesCompleted = user.enrolledCourses.filter(course => course.completed).length;
      const userAchievements = await UserAchievement.find({ userId: user._id });
      const achievements = await Achievement.find({ type: 'course' });
      
      for (const achievement of achievements) {
        const userAchievement = userAchievements.find(
          ua => ua.achievementId.toString() === achievement._id.toString()
        );
        
        if (!userAchievement || userAchievement.progress < coursesCompleted) {
          await UserAchievement.findOneAndUpdate(
            { userId: user._id, achievementId: achievement._id },
            { 
              $set: { 
                progress: coursesCompleted,
                unlockedAt: coursesCompleted >= achievement.requirement ? new Date() : null
              }
            },
            { upsert: true }
          );
        }
      }
    }

    await user.save();

    res.json({
      message: 'Прогресс урока обновлен',
      progress: courseEnrollment
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении прогресса',
      error: error.message 
    });
  }
});

// Обработчик завершения урока
router.post('/:courseId/lessons/:lessonId/complete', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.userId;

    const course = await Course.findById(courseId).populate('modules');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Находим модуль и урок
    let foundLesson = null;
    let foundModule = null;
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => l._id.toString() === lessonId);
      if (lesson) {
        foundLesson = lesson;
        foundModule = module;
        break;
      }
    }

    if (!foundLesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Обновляем прогресс пользователя
    const enrollment = user.enrolledCourses.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrollment) {
      return res.status(400).json({ message: 'User is not enrolled in this course' });
    }

    // Находим или создаем прогресс модуля
    let moduleProgress = enrollment.moduleProgress.find(
      mp => mp.moduleId.toString() === foundModule._id.toString()
    );

    if (!moduleProgress) {
      moduleProgress = {
        moduleId: foundModule._id,
        completedLessons: [],
        completed: false
      };
      enrollment.moduleProgress.push(moduleProgress);
    }

    // Проверяем, не был ли урок уже завершен
    const lessonCompleted = moduleProgress.completedLessons.some(
      cl => cl.lessonId.toString() === lessonId
    );

    if (!lessonCompleted) {
      // Добавляем урок в список завершенных
      moduleProgress.completedLessons.push({
        lessonId: foundLesson._id,
        completedAt: new Date()
      });

      // Создаем запись об активности
      await Activity.create({
        userId,
        type: 'course',
        title: `Завершен урок "${foundLesson.title}"`,
        description: course.title,
        entityId: foundLesson._id,
        timestamp: new Date()
      });

      // Проверяем, завершен ли модуль
      const allModuleLessons = foundModule.lessons.length;
      const completedModuleLessons = moduleProgress.completedLessons.length;
      
      if (allModuleLessons === completedModuleLessons) {
        moduleProgress.completed = true;
      }

      // Проверяем, завершен ли курс
      const allModulesCompleted = enrollment.moduleProgress.every(mp => mp.completed);
      if (allModulesCompleted) {
        enrollment.completed = true;
        
        // Создаем запись об активности о завершении курса
        await Activity.create({
          userId,
          type: 'course',
          title: `Завершен курс "${course.title}"`,
          description: `Поздравляем с завершением курса!`,
          entityId: course._id,
          timestamp: new Date()
        });
      }

      await user.save();
    }

    res.json({ 
      message: 'Lesson completed successfully',
      progress: enrollment.progress,
      completed: enrollment.completed
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обновить курс (только создатель или админ)
router.put('/:id', teacherOrAdminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем права на редактирование
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'У вас нет прав на редактирование этого курса' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, createdBy: course.createdBy }, // Сохраняем оригинального создателя
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при обновлении курса', error });
  }
});

// Удалить курс (только создатель или админ)
router.delete('/:id', teacherOrAdminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем права на удаление
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'У вас нет прав на удаление этого курса' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Курс успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Функция для обработки завершения урока
async function handleLessonCompletion(course, moduleId, lessonId, userId) {
  // Находим пользователя
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Находим запись о прохождении курса
  const enrollment = user.enrolledCourses.find(
    e => e.courseId.toString() === course._id.toString()
  );

  if (!enrollment) {
    throw new Error('Пользователь не записан на этот курс');
  }

  // Находим модуль и урок в курсе
  const moduleIndex = course.modules.findIndex(m => m._id.toString() === moduleId);
  const module = course.modules[moduleIndex];
  const lessonIndex = module.lessons.findIndex(l => l._id.toString() === lessonId);

  // Находим прогресс модуля
  const moduleProgress = enrollment.moduleProgress.find(
    mp => mp.moduleId.toString() === moduleId
  );

  // Обновляем общее количество упражнений в модуле, если еще не обновлено
  if (moduleProgress.totalExercises === 0) {
    moduleProgress.totalExercises = module.lessons.filter(lesson => lesson.exercise).length;
  }

  // Если урок еще не отмечен как завершенный, добавляем его
  let completedLesson = moduleProgress.completedLessons.find(
    lesson => lesson.lessonId && lesson.lessonId.toString() === lessonId
  );

  const lesson = module.lessons[lessonIndex];
  const hasExercise = !!lesson.exercise;

  if (!completedLesson) {
    completedLesson = {
      lessonId: lessonId,
      completedAt: new Date(),
      exerciseCompleted: hasExercise,
      exerciseCompletedAt: hasExercise ? new Date() : null,
      exerciseAttempts: hasExercise ? 1 : 0
    };
    moduleProgress.completedLessons.push(completedLesson);
    
    // Увеличиваем счетчик выполненных упражнений, если это упражнение
    if (hasExercise) {
      moduleProgress.exercisesCompleted = (moduleProgress.exercisesCompleted || 0) + 1;
    }
  } else if (hasExercise && !completedLesson.exerciseCompleted) {
    // Если это упражнение и оно еще не было отмечено как выполненное
    completedLesson.exerciseCompleted = true;
    completedLesson.exerciseCompletedAt = new Date();
    completedLesson.exerciseAttempts += 1;
    moduleProgress.exercisesCompleted = (moduleProgress.exercisesCompleted || 0) + 1;
  }

  // Проверяем, завершен ли модуль
  const allLessonsInModuleCompleted = module.lessons.every(lesson =>
    moduleProgress.completedLessons.some(
      completed => completed.lessonId && 
      completed.lessonId.toString() === lesson._id.toString() && 
      (lesson.exercise ? completed.exerciseCompleted : true)
    )
  );
  moduleProgress.completed = allLessonsInModuleCompleted;

  // Обновляем общий прогресс курса с помощью метода из модели пользователя
  await user.updateCourseProgress(course._id);

  // Проверяем, завершен ли весь курс
  enrollment.completed = enrollment.moduleProgress.every(mp => mp.completed);

  // Сохраняем изменения
  await user.save();

  // Определяем следующий урок для навигации
  let nextLesson = null;
  let nextModule = null;

  // Проверяем, есть ли следующий урок в текущем модуле
  if (lessonIndex < module.lessons.length - 1) {
    nextLesson = module.lessons[lessonIndex + 1];
    nextModule = module;
  }
  // Если нет, проверяем следующий модуль
  else if (moduleIndex < course.modules.length - 1) {
    nextModule = course.modules[moduleIndex + 1];
    nextLesson = nextModule.lessons[0];
  }

  return {
    success: true,
    progress: enrollment.progress,
    moduleCompleted: moduleProgress.completed,
    courseCompleted: enrollment.completed,
    exercisesCompleted: moduleProgress.exercisesCompleted,
    totalExercises: moduleProgress.totalExercises,
    navigation: nextLesson ? {
      hasNextLesson: true,
      nextModuleId: nextModule._id.toString(),
      nextLessonId: nextLesson._id.toString()
    } : {
      hasNextLesson: false
    }
  };
}

export default router;