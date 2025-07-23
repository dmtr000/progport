import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['course', 'exercise', 'forum', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска по пользователю и дате
activitySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('Activity', activitySchema); 