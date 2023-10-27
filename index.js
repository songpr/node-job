function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}
class Job {
  constructor({
    interval = 1000,
    max = 10000,
    jobHandle,
    name = `Job_${new Date().getTime()}`,
  } = {}) {
    if (jobHandle === undefined || typeof jobHandle !== "function") {
      throw new TypeError("jobHandle must be provided and must be a function");
    }
    if (!isNumber(interval)) {
      throw new TypeError("interval must be a number");
    }
    if (!isNumber(max)) {
      throw new TypeError("max must be a number");
    }
    this.interval = interval;
    this.max = max;
    this.jobHandle = jobHandle;
    this.name = name;
    this.data = [];
  }

  addData(value) {
    if (this.data.length >= this.max) {
      //clear timeout if any
      if (this.timeout !== undefined) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }
      //call jobHandle with all data and clear data
      const data = this.data;
      this.data = [];
      this.jobHandle(data);
    } else if (this.timeout === undefined) {
      const job = this;
      this.timeout = setTimeout(() => {
        const data = job.data;
        job.data = [];
        job.jobHandle.apply(job, [data]);
        //clear timeout after running jobHandle
        clearTimeout(this.timeout);
        job.timeout = undefined;
      }, this.interval);
    }
    this.data.push(value);
  }
}

export default Job;
