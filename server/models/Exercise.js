import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  language: {
    type: String,
    required: true
  },
  starterCode: {
    type: String,
    default: ''
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    description: String
  }],
  hints: [{
    type: String
  }],
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для оптимизации запросов по курсу и модулю
exerciseSchema.index({ courseId: 1, moduleId: 1 });

// Индекс для сортировки по порядку
exerciseSchema.index({ moduleId: 1, order: 1 });

export default mongoose.model('Exercise', exerciseSchema); 