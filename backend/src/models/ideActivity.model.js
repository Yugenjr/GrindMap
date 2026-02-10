import mongoose from "mongoose";

const ideActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ideType: { type: String, required: true, enum: ['vscode', 'intellij', 'pycharm', 'sublime', 'vim', 'other'] },
    sessionId: { type: String, required: true },
    activityType: {
      type: String,
      required: true,
      enum: ['session_start', 'session_end', 'file_open', 'file_close', 'code_edit', 'submission_attempt', 'submission_success', 'debug_start', 'debug_end', 'test_run']
    },
    filePath: { type: String },
    platform: { type: String, enum: ['leetcode', 'codeforces', 'codechef', 'atcoder', 'hackerrank', 'other'] },
    problemId: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      linesChanged: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 }, // in milliseconds
      language: { type: String },
      testResults: { type: Object },
      submissionData: { type: Object },
      cursorPosition: { type: Object },
      viewport: { type: Object }
    }
  },
  { timestamps: true }
);

// Index for efficient queries
ideActivitySchema.index({ user: 1, sessionId: 1, timestamp: -1 });
ideActivitySchema.index({ user: 1, platform: 1, timestamp: -1 });

const IdeActivity = mongoose.model("IdeActivity", ideActivitySchema);
export default IdeActivity;
