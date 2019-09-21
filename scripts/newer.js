const fs = require("fs");
const path = require("path");

/**
 * @param {string|string[]} inputs 
 * @param {string|string[]} outputs 
 */
function newer(inputs, outputs) {
    const outputsTimestamp = collectTimestamps(Array.isArray(outputs) ? outputs : [outputs], Math.min);
    return outputsTimestamp === -Infinity || collectTimestamps(Array.isArray(inputs) ? inputs : [inputs], Math.max) > outputsTimestamp;
}

exports.newer = newer;

/**
 *
 * @param {string[]} files
 * @param {(a: number, b: number) => number} minMax
 */
function collectTimestamps(files, minMax) {
    /** @type {number} */
    let timestamp;
    for (const file of files) {
        try {
            const stat = fs.statSync(file);
            if (stat.isFile()) {
                timestamp = chooseTimestamp(timestamp, stat.mtimeMs, minMax);
            }
            else if (stat.isDirectory()) {
                const children = fs.readdirSync(file).map(name => path.join(file, name));
                timestamp = chooseTimestamp(timestamp, collectTimestamps(children, minMax), minMax);
            }
        }
        catch (e) {
            if (e.code === "ENOENT") {
                timestamp = chooseTimestamp(timestamp, -Infinity, minMax);
            }
            else {
                throw e;
            }
        }
    }
    return timestamp;
}

function chooseTimestamp(left, right, minMax) {
    if (left === undefined) return right;
    if (right === undefined) return left;
    return minMax(left, right);
}
