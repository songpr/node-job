export default Job;
/**
 * @class Job - Job class run jobHandle with data after interval.
 * jobHandle will be called with data as first argument, every interval milliseconds, if any only if data is not empty.
 * if data length >= max, jobHandle will be called immediately, and data will be cleared.
 *
 * @param {Object} options - Job options.
 * @param {Number} options.interval - Interval in milliseconds.
 * @param {Number} options.max - Maximum data length.
 * @param {Function(T)} options.jobHandle - Job handle function, must be a function or async function.
 *  will receive data (array) as first argument.
 * @param {String} [options.name] - Job name.
 * @param {L} [options.log] - Log object, must have debug, log, info, warn, error function.
 *
 */
declare class Job<T, L> {
    constructor({ interval, max, jobHandle, name, log: L, }?: {
        interval?: number;
        max?: number;
        jobHandle: ((data: T[]) => void) | ((data: T[]) => Promise<void>);
        name?: string;
        log?: L;
    });
    readonly interval: number;
    readonly max: number;
    readonly name: string;
    readonly log: L;
    addData(value: T): void;
}
