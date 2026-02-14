// Performance Monitoring and Optimization Utilities
const logger = require('./logger')('performance');

class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.slowThresholds = new Map();
  }

  /**
   * Start measuring performance
   */
  start(label, slowThresholdMs = 1000) {
    const startTime = process.hrtime.bigint();
    
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    
    if (slowThresholdMs > 0) {
      this.slowThresholds.set(label, slowThresholdMs);
    }
    
    return () => this.end(label, startTime);
  }

  /**
   * End measuring performance
   */
  end(label, startTime) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    
    const measurements = this.measurements.get(label) || [];
    measurements.push(durationMs);
    this.measurements.set(label, measurements);
    
    const threshold = this.slowThresholds.get(label) || 0;
    if (threshold > 0 && durationMs > threshold) {
      logger.warn(`Slow operation: ${label}`, { duration: `${durationMs.toFixed(2)}ms` });
    }
    
    return durationMs;
  }

  /**
   * Get stats for a measurement
   */
  getStats(label) {
    const measurements = this.measurements.get(label) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return {
      count: measurements.length,
      total: `${sum.toFixed(2)}ms`,
      average: `${avg.toFixed(2)}ms`,
      min: `${min.toFixed(2)}ms`,
      max: `${max.toFixed(2)}ms`,
      median: `${median.toFixed(2)}ms`,
      p95: `${p95.toFixed(2)}ms`,
      p99: `${p99.toFixed(2)}ms`,
    };
  }

  /**
   * Clear measurements
   */
  clear(label) {
    if (label) {
      this.measurements.delete(label);
      this.slowThresholds.delete(label);
    } else {
      this.measurements.clear();
      this.slowThresholds.clear();
    }
  }

  /**
   * Get all stats
   */
  getAllStats() {
    const stats = {};
    
    for (const [label] of this.measurements) {
      stats[label] = this.getStats(label);
    }
    
    return stats;
  }
}

/**
 * Debounce function
 */
const debounce = (fn, delayMs) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
};

/**
 * Throttle function
 */
const throttle = (fn, delayMs) => {
  let lastCallTime = 0;
  let timeoutId;
  
  return (...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall >= delayMs) {
      fn(...args);
      lastCallTime = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        lastCallTime = Date.now();
      }, delayMs - timeSinceLastCall);
    }
  };
};

/**
 * Profile async function
 */
const profile = async (label, fn, slowThresholdMs = 1000) => {
  const monitor = new PerformanceMonitor();
  const end = monitor.start(label, slowThresholdMs);
  
  try {
    const result = await fn();
    const duration = end();
    return { result, duration };
  } catch (error) {
    const duration = end();
    logger.error(`Error in ${label}`, { duration: `${duration.toFixed(2)}ms`, error: error.message });
    throw error;
  }
};

/**
 * Measure memory usage
 */
const measureMemory = () => {
  const usage = process.memoryUsage();
  
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  };
};

module.exports = {
  PerformanceMonitor,
  debounce,
  throttle,
  profile,
  measureMemory,
};
