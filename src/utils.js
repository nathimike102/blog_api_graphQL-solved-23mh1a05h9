// Common Utility Functions

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retry = async (fn, options = {}) => {
  const { maxAttempts = 3, delay: delayMs = 1000, backoff = true } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delayMs * attempt : delayMs;
        await delay(waitTime);
      }
    }
  }

  throw lastError;
};

const batch = (items, batchSize) => {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
};

const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const pick = (obj, keys) => {
  const result = {};
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

const flatten = (obj, prefix = '') => {
  const flattened = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flatten(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
};

const groupBy = (items, key) => {
  return items.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

const unique = (items, key) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = key ? item[key] : item;
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

const difference = (arr1, arr2) => {
  return arr1.filter((item) => !arr2.includes(item));
};

const intersection = (arr1, arr2) => {
  return arr1.filter((item) => arr2.includes(item));
};

const zip = (...arrays) => {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  return Array.from({ length: maxLength }, (_, i) =>
    arrays.map((arr) => arr[i])
  );
};

module.exports = {
  delay,
  retry,
  batch,
  deepClone,
  pick,
  omit,
  flatten,
  groupBy,
  unique,
  difference,
  intersection,
  zip,
};
