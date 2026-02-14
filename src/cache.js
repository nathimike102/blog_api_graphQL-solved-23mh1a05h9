class Cache {
  constructor(ttl = 60000) {
    this.store = new Map();
    this.ttl = ttl;
    this.timers = new Map();
  }

  set(key, value, ttl = this.ttl) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store value
    this.store.set(key, {
      value,
      createdAt: Date.now(),
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.createdAt;
    if (age > this.ttl) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.store.forEach((_, key) => {
      this.delete(key);
    });
  }

  size() {
    return this.store.size;
  }

  keys() {
    return Array.from(this.store.keys());
  }
}

// Memoization decorator
const memoize = (fn, ttl = 60000) => {
  const cache = new Cache(ttl);

  return async (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
};

module.exports = {
  Cache,
  memoize,
};
