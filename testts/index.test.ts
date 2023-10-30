import Job from "node-interval-job";
const jobHandle = async (data: string[]) => {
    console.log("jobHandle", data);
}
const job = new Job<string>({ interval: 200, max: 10, jobHandle });
job.addData("test");

