/**
 * Comprehensive logging utility
 */
class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    };

    this.currentLevel = this.levels.INFO;
    
    if (process.env.LOG_LEVEL) {
      this.currentLevel = this.levels[process.env.LOG_LEVEL.toUpperCase()] || this.levels.INFO;
    } else if (process.env.NODE_ENV === 'development') {
      this.currentLevel = this.levels.DEBUG;
    } else if (process.env.NODE_ENV === 'production') {
      this.currentLevel = this.levels.INFO;
    }
  }

  /**
   * Format log message with timestamp and context
   */
  format(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 
      ? ` ${JSON.stringify(context)}` 
      : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Log error
   */
  error(message, error = null, context = {}) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(this.format('ERROR', message, context));
      if (error) {
        console.error(error.stack || error);
      }
    }
  }

  /**
   * Log warning
   */
  warn(message, context = {}) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(this.format('WARN', message, context));
    }
  }

  /**
   * Log info
   */
  info(message, context = {}) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(this.format('INFO', message, context));
    }
  }

  /**
   * Log debug
   */
  debug(message, context = {}) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(this.format('DEBUG', message, context));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, duration) {
    const message = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
    this.info(message, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log database operation
   */
  logDatabase(operation, collection, duration, context = {}) {
    this.debug(`Database: ${operation} on ${collection} - ${duration}ms`, context);
  }

  /**
   * Log external API call
   */
  logExternalApi(service, endpoint, duration, success = true) {
    const level = success ? 'debug' : 'error';
    this[level](`External API: ${service} ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Log ML service operation
   */
  logML(operation, duration, success = true) {
    const level = success ? 'debug' : 'error';
    this[level](`ML Service: ${operation} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
  }
}

export const logger = new Logger();
