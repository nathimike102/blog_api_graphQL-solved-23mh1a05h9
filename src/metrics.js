class Metrics {
  constructor() {
    this.queries = {
      count: 0,
      totalTime: 0,
      slow: [],
    };
    this.mutations = {
      count: 0,
      totalTime: 0,
      slow: [],
    };
    this.subscriptions = {
      active: 0,
      total: 0,
    };
    this.errors = {
      count: 0,
      byType: {},
    };
    this.startTime = Date.now();
  }

  recordQuery(duration, isSlow = false) {
    this.queries.count++;
    this.queries.totalTime += duration;
    if (isSlow) {
      this.queries.slow.push({
        duration,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 100 slow queries
      if (this.queries.slow.length > 100) {
        this.queries.slow.shift();
      }
    }
  }

  recordMutation(duration, isSlow = false) {
    this.mutations.count++;
    this.mutations.totalTime += duration;
    if (isSlow) {
      this.mutations.slow.push({
        duration,
        timestamp: new Date().toISOString(),
      });
      if (this.mutations.slow.length > 100) {
        this.mutations.slow.shift();
      }
    }
  }

  incrementSubscription(isNew = true) {
    if (isNew) this.subscriptions.total++;
    this.subscriptions.active++;
  }

  decrementSubscription() {
    if (this.subscriptions.active > 0) {
      this.subscriptions.active--;
    }
  }

  recordError(errorType) {
    this.errors.count++;
    this.errors.byType[errorType] = (this.errors.byType[errorType] || 0) + 1;
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgQueryTime = this.queries.count > 0 ? this.queries.totalTime / this.queries.count : 0;
    const avgMutationTime = this.mutations.count > 0 ? this.mutations.totalTime / this.mutations.count : 0;

    return {
      uptime: `${Math.floor(uptime / 1000)}s`,
      queries: {
        count: this.queries.count,
        average: `${Math.round(avgQueryTime)}ms`,
        slow: this.queries.slow,
      },
      mutations: {
        count: this.mutations.count,
        average: `${Math.round(avgMutationTime)}ms`,
        slow: this.mutations.slow,
      },
      subscriptions: this.subscriptions,
      errors: this.errors,
    };
  }

  reset() {
    this.queries = { count: 0, totalTime: 0, slow: [] };
    this.mutations = { count: 0, totalTime: 0, slow: [] };
    this.subscriptions = { active: 0, total: 0 };
    this.errors = { count: 0, byType: {} };
    this.startTime = Date.now();
  }
}

module.exports = new Metrics();
