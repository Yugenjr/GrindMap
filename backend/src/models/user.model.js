import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { SECURITY } from "../constants/app.constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    shadowBanned: {
      type: Boolean,
      default: false,
      select: false,
    },
    shadowBannedAt: {
      type: Date,
      select: false,
    },
    bannedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  }
);

// Indexes for performance (removed duplicate email index)
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it's modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Hash password with secure rounds
    this.password = await bcrypt.hash(this.password, SECURITY.BCRYPT_ROUNDS);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error('Password not available for comparison');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts (ATOMIC)
userSchema.methods.incLoginAttempts = async function () {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      // Re-fetch user with session lock
      const user = await mongoose.model('User').findById(this._id).session(session);

      // Check if lock has expired
      if (user.lockUntil && user.lockUntil < Date.now()) {
        return await mongoose.model('User').findByIdAndUpdate(
          this._id,
          {
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
          },
          { session, new: true }
        );
      }

      const updates = { $inc: { loginAttempts: 1 } };

      // Lock account after max attempts
      if (user.loginAttempts + 1 >= SECURITY.MAX_LOGIN_ATTEMPTS) {
        updates.$set = { lockUntil: Date.now() + SECURITY.LOCKOUT_TIME };
      }

      return await mongoose.model('User').findByIdAndUpdate(
        this._id,
        updates,
        { session, new: true }
      );
    });
  } finally {
    await session.endSession();
  }
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

const User = mongoose.model("User", userSchema);
export default User;
