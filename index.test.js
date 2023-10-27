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
      console.log(data);
    });
    const job = new Job({ interval: 1000, max: 10, jobHandle });
    for (let i = 1; i < 5; i++) {
      const random = randomInteger(2, i + 3);
      const values = new Array(random).fill(0).map((_, index) => `"value${i} ${index}"`);
      values.forEach((val) => job.addData(val));
      assert.strictEqual(jobHandle.mock.calls.length, 0, `test round ${i} before interval`); //jobHandle is not called yet for this round
      await new Promise((resolve) => setTimeout(resolve, 1001));
      assert.strictEqual(jobHandle.mock.calls.length, 1, `test round ${i} after interval`); //jobHandle is called
      const call = jobHandle.mock.calls[0];
      assert.deepStrictEqual(call.arguments, [values]);
      assert.strictEqual(job.data.length, 0); //cache is cleared
      jobHandle.mock.resetCalls(); //
    }

    mock.reset(); // Reset the globally tracked mocks.
  });
});
