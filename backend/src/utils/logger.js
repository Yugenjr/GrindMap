import fs from 'fs';
import path from 'path';

class Logger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLog(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  writeLog(filename, content) {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, content);
  }

  info(message, meta = {}) {
    const log = this.formatLog('INFO', message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.log(log.trim());
    }
    this.writeLog('app.log', log);
  }

  error(message, meta = {}) {
    const log = this.formatLog('ERROR', message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.error(log.trim());
    }
    this.writeLog('error.log', log);
  }

  warn(message, meta = {}) {
    const log = this.formatLog('WARN', message, meta);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(log.trim());
    }
    this.writeLog('app.log', log);
  }

  request(req, res, duration) {
    const log = this.formatLog('REQUEST', 'HTTP Request', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    this.writeLog('access.log', log);
  }
}

export default new Logger();