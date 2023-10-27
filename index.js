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
    if (
      jobHandle === undefined ||
      (typeof jobHandle !== "function" && !types.isAsyncFunction(jobHandle))
    ) {
      throw new TypeError(
        "jobHandle must be provided and must be a function or async function",
      );
    }
    if (!isNumber(interval)) {
      throw new TypeError("interval must be a number");
    }
    if (!isNumber(max)) {
      throw new TypeError("max must be a number");
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
    if (this.data.length >= this.max) {
      //clear timeout if any
      if (this.timeout !== undefined) {
        clearTimeout(this.timeout);
        this.timeout.unref();
        this.timeout = undefined;
      }
      //call jobHandle with all data and clear data
      const data = this.data;
      this.data = [];
      this.jobHandle(data).catch((err) => {
        console.log({ error: err.message, stack: err.stack });
      });
    } else if (this.timeout === undefined) {
      this.timeout = setTimeoutBuilder(this);
    }
    this.data.push(value);
  }
}

export default Job;
