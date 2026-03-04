import jwt from 'jsonwebtoken';
import { parse } from 'url';
import Logger from './logger.js';

export class WebSocketAuth {
  static authenticate(request) {
    try {
      const { query } = parse(request.url, true);
      const token = query.token || request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('No token provided');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        userId: decoded.id,
        email: decoded.email,
        authenticated: true
      };
    } catch (error) {
      Logger.warn('WebSocket authentication failed', { error: error.message });
      return { authenticated: false, error: error.message };
    }
  }
  
  static generateSocketToken(userId, email) {
    return jwt.sign(
      { id: userId, email, type: 'websocket' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
}