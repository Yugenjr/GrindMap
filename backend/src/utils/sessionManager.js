import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Session management to prevent concurrent session issues
 */
class SessionManager {
  /**
   * Create session with atomic token generation
   */
  static async createSession(userId, deviceInfo = {}) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const sessionData = {
          userId,
          deviceInfo,
          createdAt: new Date(),
          isActive: true
        };
        
        // Generate unique session token
        const token = jwt.sign(
          { 
            id: userId, 
            sessionId: new mongoose.Types.ObjectId().toString(),
            timestamp: Date.now()
          }, 
          process.env.JWT_SECRET, 
          { expiresIn: '7d' }
        );
        
        return { token, sessionData };
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Validate session atomically
   */
  static async validateSession(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists and is active
      const user = await mongoose.model('User').findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('Invalid session');
      }
      
      return { userId: decoded.id, sessionId: decoded.sessionId };
    } catch (error) {
      throw new Error('Invalid or expired session');
    }
  }
}

export default SessionManager;