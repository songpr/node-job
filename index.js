import TTLCache from "@isaacs/ttlcache";
class Job {
  constructor({ interval = 1000, max = 10000, jobHandle } = {}) {
    if (jobHandle === undefined || typeof jobHandle !== "function") {
      throw new TypeError("jobHandle must be provided and must be a function");
    }
    if (!isNumber(interval)) {
      throw new TypeError("interval must be a number");
    }
    if (!isNumber(max)) {
      throw new TypeError("max must be a number");
    }
    const job = this;
    const dispose = (value, key, reason) => {
      //reason = set, delete will be ignored
      if (reason === "stale" || reason === "evict") {
        //an item in cache is expired, or cache is full
        //set cache of job to new TTLCache so this cache will be not changed
        const _cache = job.cache;
        job.cache = new TTLCache({
          max: max,
          ttl: interval,
          dispose: dispose,
        });
        const values = [value, ..._cache.values()];
        _cache.clear(); //clear cache, and the dispose function will be called for each item with reason = deleted
        jobHandle(values);
      }
    };
    this.cache = new TTLCache({
      max: max,
      ttl: interval,
      dispose: dispose,
    });
  }
  addData(value) {
    this.cache.set(value, value);
  }
}

module.exports = Job;
