import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  friendProgress: {
    enabled: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    browser: { type: Boolean, default: true },
    platforms: {
      type: [String],
      default: ['LEETCODE', 'CODEFORCES', 'CODECHEF']
    }
  },
  achievements: {
    enabled: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    browser: { type: Boolean, default: true }
  },
  streaks: {
    enabled: { type: Boolean, default: true },
    sound: { type: Boolean, default: false },
    browser: { type: Boolean, default: true }
  },
  system: {
    enabled: { type: Boolean, default: true },
    sound: { type: Boolean, default: false },
    browser: { type: Boolean, default: true }
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' },
    endTime: { type: String, default: '08:00' },
    timezone: { type: String, default: 'UTC' }
  }
}, {
  timestamps: true
});

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
export default NotificationPreferences;