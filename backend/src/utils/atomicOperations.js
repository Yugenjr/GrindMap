import mongoose from 'mongoose';

/**
 * Atomic operations utility to prevent race conditions
 */
class AtomicOperations {
  /**
   * Atomic login attempt increment with proper locking
   */
  static async incrementLoginAttempts(userId) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const user = await mongoose.model('User').findById(userId).session(session);
        
        if (!user) {
          throw new Error('User not found');
        }

        // Check if lock has expired
        if (user.lockUntil && user.lockUntil < Date.now()) {
          return await mongoose.model('User').findByIdAndUpdate(
            userId,
            {
              $unset: { lockUntil: 1 },
              $set: { loginAttempts: 1 }
            },
            { session, new: true }
          );
        }

        const updates = { $inc: { loginAttempts: 1 } };
        
        // Lock account if max attempts reached
        if (user.loginAttempts + 1 >= 5) {
          updates.$set = { lockUntil: Date.now() + (15 * 60 * 1000) };
        }

        return await mongoose.model('User').findByIdAndUpdate(
          userId,
          updates,
          { session, new: true }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Atomic token operations to prevent concurrent token issues
   */
  static async updateTokens(userId, tokenData) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        return await mongoose.model('User').findByIdAndUpdate(
          userId,
          {
            $set: {
              ...tokenData,
              lastLogin: new Date()
            },
            $unset: { loginAttempts: 1, lockUntil: 1 }
          },
          { session, new: true }
        );
      });
    } finally {
      await session.endSession();
    }
  }
}

export default AtomicOperations;