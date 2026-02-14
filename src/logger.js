const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

class Logger {
  constructor(module) {
    this.module = module;
    this.level = LOG_LEVELS[LOG_LEVEL];
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  format(level, message, data = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      module: this.module,
      message,
      ...data,
    });
  }

  debug(message, data) {
    if (LOG_LEVELS.DEBUG >= this.level) {
      console.log(this.format('DEBUG', message, data));
    }
  }

  info(message, data) {
    if (LOG_LEVELS.INFO >= this.level) {
      console.log(this.format('INFO', message, data));
    }
  }

  warn(message, data) {
    if (LOG_LEVELS.WARN >= this.level) {
      console.warn(this.format('WARN', message, data));
    }
  }

  error(message, data) {
    if (LOG_LEVELS.ERROR >= this.level) {
      console.error(this.format('ERROR', message, data));
    }
  }
}

module.exports = (module) => new Logger(module);
