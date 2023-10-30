import { describe, it, mock } from "node:test";
import assert from "node:assert";
import Job from "../index.js";

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe("Job handle", () => {
  it("should throw error if jobHandle is not provided", () => {
    assert.throws(() => new Job(), TypeError);
  });

  it("should clear data and call jobHandle every interval with all values during each interval", async (t) => {
    console.log(
      `test should clear data and call jobHandle every interval with all values during each interval`,
    );
    const jobHandle = t.mock.fn((data) => {
      console.log(`job handle called with data:`);
      console.log(data);
    });
    const job = new Job({ interval: 200, max: 10, jobHandle });
    for (let i = 1; i < 10; i++) {
      jobHandle.mock.resetCalls(); //
      const valueLength = randomInteger(2, 7); // do not generate too many values otherwise jobHanlder will not be finish before await
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
      await new Promise((resolve) => setTimeout(resolve, 200 + 100)); //wait for interval 200ms + 150ms for jobHandle to finish
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
    console.log(
      `test should clear data and call jobHandle every interval with all values during each interval; check after all intervals`,
    );
    const round = 20;
    const jobHandle = t.mock.fn((data) => {
      console.log(`job handle called with data:`);
      console.log(data);
    });
    const job = new Job({ interval: 200, max: round * 2, jobHandle });
    jobHandle.mock.resetCalls(); //
    assert.strictEqual(jobHandle.mock.calls.length, 0, `test before interval`); //jobHandle is not called yet for this round

    for (let i = 1; i <= round; i++) {
      const valueLength = randomInteger(2, i + 3); // do not generate too many values otherwise jobHanlder will not be finish before await
      const values = new Array(valueLength)
        .fill(0)
        .map((_, index) => `"value${i} ${index}"`);
      values.forEach((val) => job.addData(val));
      //wait for interval
      await new Promise((resolve) => setTimeout(resolve, 210)); //wait for interval 200ms + 10ms to make sure interval is passed
    }
    await new Promise((resolve) => setTimeout(resolve, 20 * round)); //wait for calls to finish
    assert.strictEqual(
      jobHandle.mock.calls.length,
      round,
      `test round ${round} after intervals, jobHandle should be called ${round} times`,
    ); //jobHandle is called
    mock.reset(); // Reset the globally tracked mocks.
  });

  it("should clear data and call jobHandle every time it reach max with all values during each interval; ", async (t) => {
    console.log(
      `test should clear data and call jobHandle every interval with all values during each interval; check after all intervals`,
    );
    const round = 10;
    const max = 10;
    const jobHandle = t.mock.fn((data) => {
      console.log(`job handle called with data:`);
      console.log(data);
    });
    const job = new Job({ interval: 50000, max: max, jobHandle });
    jobHandle.mock.resetCalls(); //
    assert.strictEqual(jobHandle.mock.calls.length, 0, `test before interval`); //jobHandle is not called yet for this round
    // values length round * max
    const values = new Array(round * max)
      .fill(0)
      .map((_, index) => `"value ${index}"`);
    for (let i = 0; i <= values.length; i++) {
      job.addData(values[i]);
    }
    await new Promise((resolve) => setTimeout(resolve, 30 * round)); //wait for calls to finish
    assert.strictEqual(
      jobHandle.mock.calls.length,
      round,
      `test ${round * max} values with max 10, jobHandle should be called ${round} times`,
    ); //jobHandle is called
    for (const call of jobHandle.mock.calls) {
      assert.strictEqual(
        call.arguments[0].length,
        max,
        `test with max ${max}, data should be of ${max} length`,
      ); //jobHandle is called
    }
    mock.reset(); // Reset the globally tracked mocks.
  });
});

