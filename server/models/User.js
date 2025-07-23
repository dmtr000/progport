import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    code: {
      type: String
    },
    expiresAt: {
      type: Date
    }
  },
  resetPasswordCode: {
    code: {
      type: String
    },
    expiresAt: {
      type: Date
    }
  },
  emailChangeRequest: {
    newEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    currentEmailCode: {
      type: String
    },
    newEmailCode: {
      type: String
    },
    expiresAt: {
      type: Date
    },
    step: {
      type: String,
      enum: ['verify_current', 'verify_new']
    },
    lastCodeSentAt: {
      type: Date
    }
  },
  avatar: {
    type: String,
    default: 'https://polinka.top/uploads/posts/2023-06/1686495153_polinka-top-p-polzovatel-kartinka-dlya-prezentatsii-inst-64.jpg'
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    progress: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    lastAccessDate: {
      type: Date,
      default: Date.now
    },
    completed: {
      type: Boolean,
      default: false
    },
    moduleProgress: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedLessons: [{
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        completedAt: {
          type: Date,
          default: Date.now
        },
        exerciseCompleted: {
          type: Boolean,
          default: false
        },
        exerciseCompletedAt: {
          type: Date
        },
        exerciseAttempts: {
          type: Number,
          default: 0
        }
      }],
      completed: {
        type: Boolean,
        default: false
      },
      exercisesCompleted: {
        type: Number,
        default: 0
      },
      totalExercises: {
        type: Number,
        default: 0
      }
    }]
  }],
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  forumStats: {
    topics: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    },
    helpfulAnswers: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: null
  },
  streak: {
    type: Number,
    default: 0
  },
  completedExercises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }],
  previousPasswords: [{
    hash: String,
    changedAt: Date
  }],
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockUntil: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Метод для очистки удаленных курсов
userSchema.methods.cleanupDeletedCourses = async function() {
  try {
    // Фильтруем курсы, проверяя их существование
    const validEnrollments = [];
    for (const enrollment of this.enrolledCourses) {
      const courseExists = await mongoose.model('Course').exists({ _id: enrollment.courseId });
      if (courseExists) {
        validEnrollments.push(enrollment);
      }
    }

    // Обновляем список курсов
    this.enrolledCourses = validEnrollments;
    await this.save();

    console.log('Cleaned up deleted courses for user:', this._id);
    return this.enrolledCourses;
  } catch (error) {
    console.error('Error cleaning up deleted courses:', error);
    throw error;
  }
};

// Метод для получения статистики упражнений по курсу
userSchema.methods.getExerciseStats = function(courseId) {
  const enrollment = this.enrolledCourses.find(
    course => course.courseId.toString() === courseId.toString()
  );

  if (!enrollment) {
    return { completed: 0, total: 0 };
  }

  let completedExercises = 0;
  let totalExercises = 0;

  enrollment.moduleProgress.forEach(module => {
    // Считаем количество выполненных упражнений (где exerciseCompleted = true)
    completedExercises += module.completedLessons.filter(lesson => lesson.exerciseCompleted).length;
    
    // Обновляем значение exercisesCompleted в модуле
    module.exercisesCompleted = module.completedLessons.filter(lesson => lesson.exerciseCompleted).length;
  });

  return {
    completed: completedExercises,
    total: totalExercises
  };
};

// Метод для обновления прогресса курса
userSchema.methods.updateCourseProgress = async function(courseId) {
  try {
    const courseEnrollment = this.enrolledCourses.find(
      course => course.courseId.toString() === courseId.toString()
    );

    if (courseEnrollment) {
      const course = await mongoose.model('Course').findById(courseId);
      if (!course) return;

      let totalLessons = 0;
      let completedLessons = 0;

      // Подсчитываем общее количество уроков и завершенных уроков
      course.modules.forEach(module => {
        const moduleProgress = courseEnrollment.moduleProgress.find(
          mp => mp.moduleId.toString() === module._id.toString()
        );

        if (moduleProgress) {
          // Обновляем общее количество упражнений в модуле
          const totalExercisesInModule = module.lessons.filter(lesson => lesson.exercise).length;
          moduleProgress.totalExercises = totalExercisesInModule;
          
          // Подсчитываем количество выполненных упражнений
          moduleProgress.exercisesCompleted = moduleProgress.completedLessons.filter(
            lesson => lesson.exerciseCompleted
          ).length;

          module.lessons.forEach(lesson => {
            const completedLesson = moduleProgress.completedLessons.find(
              cl => cl.lessonId.toString() === lesson._id.toString()
            );
            
            if (completedLesson) {
              // Для уроков с упражнениями проверяем exerciseCompleted
              if (lesson.exercise) {
                if (completedLesson.exerciseCompleted) {
                  completedLessons++;
                }
              } else {
                // Для теоретических уроков достаточно наличия в completedLessons
                completedLessons++;
              }
            }
            totalLessons++;
          });
        }
      });

      // Обновляем прогресс
      if (totalLessons > 0) {
        courseEnrollment.progress = Math.round((completedLessons / totalLessons) * 100);
      }

      // Проверяем, завершен ли курс
      courseEnrollment.completed = courseEnrollment.moduleProgress.every(mp => mp.completed);

      // Обновляем дату последнего доступа
      courseEnrollment.lastAccessDate = new Date();

      // Сохраняем изменения
      await this.save();
    }
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;