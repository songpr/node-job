import { describe, it, mock } from "node:test";
import assert from "node:assert";
import Job from "./index.js";

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe("Job handle", () => {
  it("should throw error if jobHandle is not provided", () => {
    assert.throws(() => new Job(), TypeError);
  });

  it("should clear data and call jobHandle every interval with all values during each interval", async (t) => {
    const jobHandle = t.mock.fn((data) => {
      console.log(`job handle called with data:`);
      console.log(data);
    });
    const job = new Job({ interval: 200, max: 10, jobHandle });
    for (let i = 1; i < 10; i++) {
      jobHandle.mock.resetCalls(); //
      const valueLength = randomInteger(2, i + 3); // do not generate too many values otherwise jobHanlder will not be finish before await
      const values = new Array(valueLength)
        .fill(0)
        .map((_, index) => `"value${i} ${index}"`);
      values.forEach((val) => job.addData(val));
      assert.strictEqual(
        jobHandle.mock.calls.length,
        0,
        `test round ${i} before interval`,
      ); //jobHandle is not called yet for this round
      //wait for interval
      await new Promise((resolve) => setTimeout(resolve, 200 + 150)); //wait for interval 200ms + 150ms for jobHandle to finish
      assert.strictEqual(
        jobHandle.mock.calls.length,
        1,
        `test round ${i} after interval`,
      ); //jobHandle is called
      const call = jobHandle.mock.calls[0];
      assert.deepStrictEqual(call.arguments, [values]);
      assert.strictEqual(job.data.length, 0); //cache is cleared
    }

    mock.reset(); // Reset the globally tracked mocks.
  });

  it("should clear data and call jobHandle every interval with all values during each interval; check after all intervals", async (t) => {
    const jobHandle = t.mock.fn((data) => {
      console.log(`job handle called with data:`);
      console.log(data);
    });
    const job = new Job({ interval: 200, max: 10, jobHandle });
    assert.strictEqual(jobHandle.mock.calls.length, 0, `test before interval`); //jobHandle is not called yet for this round
    let i = 1;
    for (; i <= 10; i++) {
      const valueLength = randomInteger(2, i + 3); // do not generate too many values otherwise jobHanlder will not be finish before await
      const values = new Array(valueLength)
        .fill(0)
        .map((_, index) => `"value${i} ${index}"`);
      values.forEach((val) => job.addData(val));
      //wait for interval
      await new Promise((resolve) => setTimeout(resolve, 210)); //wait for interval 200ms + 10ms to make sure interval is passed
    }
    await new Promise((resolve) => setTimeout(resolve, 100 * i)); //wait for calls to finish
    assert.strictEqual(
      jobHandle.mock.calls.length,
      i,
      `test round ${i - 1} after intervals, jobHandle should be called ${
        i - 1
      } times`,
    ); //jobHandle is called
    mock.reset(); // Reset the globally tracked mocks.
  });
});
