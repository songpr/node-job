function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}
import { types } from "node:util";

function setTimeoutBuilder(job) {
  return setTimeout(() => {
    const data = job.data;
    job.data = [];
    //keep timeout reference to clear it after running jobHandle
    const timeout = job.timeout;
    job.timeout = undefined; //clear timeout reference that have been run
    job.jobHandle
      .apply(job, [data])
      .catch((err) => {
        console.log({ error: err.message, stack: err.stack });
      })
      .finally(() => {
        //clear timeout after running jobHandle
        clearTimeout(timeout);
        timeout.unref();
      });
  }, job.interval);
}

class Job {
  constructor({
    interval = 1000,
    max = 10000,
    jobHandle,
    name = `Job_${new Date().getTime()}`,
  } = {}) {
    if (typeof jobHandle !== "function" && !types.isAsyncFunction(jobHandle)) {
      throw new TypeError("jobHandle must be a function or async function");
    }
    if (!isNumber(interval)) {
      throw new TypeError("interval must be a number");
    }
    if (interval < 1 || interval > 2147483647) {
      throw new TypeError(
        "interval must be greater than 0 and less than 2147483647",
      );
    }
    if (!isNumber(max)) {
      throw new TypeError("max must be a number");
    }
    if (max < 1 || max > 100000000) {
      throw new TypeError("max must be greater than 0 and less than 100000000");
    }
    this.interval = interval;
    this.max = max;
    this.timeout = undefined;
    //make sure job.jobHandle is always a async function
    this.jobHandle = types.isAsyncFunction(jobHandle)
      ? jobHandle
      : async (data) => jobHandle(data);
    this.name = name;
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
      this.data = [];
      data.push(value); //add new value
      //run jobHandle async so it will not block the main thread
      this.jobHandle(data).catch((err) => {
        console.log({ error: err.message, stack: err.stack });
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

export default Job;
