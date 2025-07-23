import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, required: true },
  description: { type: String }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  starterCode: { type: String, required: true },
  testCases: [testCaseSchema],
  hints: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  language: {
    type: String,
    enum: ['python', 'javascript'],
    default: 'python'
  }
}, { _id: true });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  duration: { type: String },
  order: { type: Number, required: true },
  exercise: exerciseSchema,
  completed: { type: Boolean, default: false },
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: true });

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true },
  lessons: [lessonSchema]
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  language: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  enrolled: {
    type: Number,
    default: 0
  },
  modules: [moduleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Виртуальное поле для общего количества уроков
courseSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((total, module) => total + module.lessons.length, 0);
});

const Course = mongoose.model('Course', courseSchema);

export default Course;