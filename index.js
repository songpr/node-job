const { types } = require("node:util");
function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}
function validateJobOptions(jobHandle, interval, max, log) {
  if (typeof jobHandle !== "function" && !types.isAsyncFunction(jobHandle)) {
    throw new TypeError("jobHandle must be a function or async function");
  }
  if (!isNumber(interval)) {
    throw new TypeError("interval must be a number");
  }
  if (interval < 1 || interval > 2147483647) {
    throw new TypeError(
      "interval must be greater than 0 and less than 2147483647"
    );
  }
  if (!isNumber(max)) {
    throw new TypeError("max must be a number");
  }
  if (max < 1 || max > 100000000) {
    throw new TypeError("max must be greater than 0 and less than 100000000");
  }
  if (log) {
    const logLevel = ['debug', 'log', 'warn', 'error'];
    for (const level of logLevel) {
      if (typeof log[level] !== "function") {
        throw new TypeError(`log.${level} must be a function`);
      }
    }
  }
}

function setTimeoutBuilder(job) {
  return setTimeout(() => {
    const data = job.data;
    job.data = [];
    //keep timeout reference to clear it after running jobHandle
    const timeout = job.timeout;
    job.timeout = undefined; //clear timeout reference that have been run
    if (data.length === 0) return; //do nothing if data is empty
    job.jobHandle
      .apply(job, [data])
      .catch((err) => {
        job.log.error({ error: err.message, stack: err.stack });
      })
      .finally(() => {
        //clear timeout after running jobHandle
        clearTimeout(timeout);
        timeout.unref();
      });
  }, job.interval);
}
/**
 * @class Job - Job class run jobHandle with data after interval.
 * jobHandle will be called with data as first argument, every interval milliseconds, if any only if data is not empty.
 * if data length >= max, jobHandle will be called immediately, and data will be cleared.
 * 
 * @param {Object} options - Job options.
 * @param {Number} options.interval - Interval in milliseconds.
 * @param {Number} options.max - Maximum data length.
 * @param {Function} options.jobHandle - Job handle function, must be a function or async function.
 *  will receive data (array) as first argument.
 * @param {String} [options.name] - Job name.
 * @param {Object} [options.log] - Log object, must have debug, log, info, warn, error function.
 * 
 */

class Job {
  constructor({
    interval = 1000,
    max = 10000,
    jobHandle,
    name = `Job_${new Date().getTime()}`,
    log = console,
  } = {}) {
    validateJobOptions(jobHandle, interval, max, log);
    this.interval = interval;
    this.max = max;
    this.timeout = undefined;
    //make sure job.jobHandle is always a async function
    this.jobHandle = types.isAsyncFunction(jobHandle)
      ? jobHandle
      : async (data) => jobHandle(data);
    this.name = name;
    this.log = log;
    this.data = [];
  }

  addData(value) {
    //case data.length >= max
    if (this.data.length >= this.max) {
      //clear timeout if any
      if (this.timeout !== undefined) {
        const timeout = this.timeout;
        this.timeout = undefined;
        clearTimeout(timeout);
        timeout.unref();
      }
      //call jobHandle with all data and clear data
      const data = this.data;
      this.data = [value];
      if (data.length === 0) return; //do nothing if data is empty
      const job = this;
      //run jobHandle async so it will not block the main thread
      this.jobHandle(data).catch((err) => {
        job.log.error({ error: err.message, stack: err.stack });
      });
    } else if (this.timeout === undefined) {
      //case data.length < max and timeout is not set
      this.data.push(value);
      this.timeout = setTimeoutBuilder(this);
    } else {
      //case data.length < max and timeout is set
      this.data.push(value);
    }
  }
}

module.exports = Job;
