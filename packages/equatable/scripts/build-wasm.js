// @ts-check
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const { spawnSync } = require("child_process");

const { argv } = yargs
    .option("input", { alias: "i", type: "string", demandOption: true })
    .option("cjs", { type: "string" })
    .option("mjs", { type: "string" });

const input = path.resolve(argv.input);
const cjsOutput = argv.cjs ? path.resolve(argv.cjs) : undefined;
const mjsOutput = argv.mjs ? path.resolve(argv.mjs) : undefined;

const wasmOptBin = require.resolve(`wasm-opt/bin/wasm-opt${process.platform === 'win32' ? ".exe" : ""}`);
const { stdout, stderr, status } = spawnSync(wasmOptBin, ["-q", "--enable-bulk-memory", "-O4", input, "-o", "-"], { stdio: "pipe" });

if (status) {
    throw new Error(stderr.toString("utf8"));
}

let buffer = stdout;
if (process.platform === "win32") {
    try {
        new WebAssembly.Module(buffer);
    }
    catch {
        // wasm-opt seems to replace \0a with \0d\0a when emitting to stdout. Try to replace all occurences and try again
        buffer = Buffer.alloc(stdout.byteLength);
        let pos = 0;
        for (let i = 0; i < stdout.byteLength; i++) {
            let byte = stdout.readUint8(i);
            if (byte === 0x0d && i < stdout.byteLength - 1 && stdout.readUint8(i + 1) === 0x0a) {
                continue;
            }
            buffer.writeUint8(byte, pos++);
        }
        buffer = buffer.slice(0, pos);
        new WebAssembly.Module(buffer);
    }
}

if (cjsOutput) {
    const text = `
// This file was generated by scripts/build-wasm.js and should not be modified.
"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });

const hasWebAssembly =
    typeof WebAssembly !== "undefined" &&
    typeof WebAssembly.Module === "function" &&
    typeof WebAssembly.Instance === "function";

const buffer = new Uint8Array([${buffer.join(",")}]);
exports.default = hasWebAssembly ? new WebAssembly.Instance(new WebAssembly.Module(buffer)).exports : undefined;
`.trim();
    try { fs.mkdirSync(path.dirname(cjsOutput), { recursive: true }); } catch { }
    fs.writeFileSync(cjsOutput, text);
}

if (mjsOutput) {
    const text = `
// This file was generated by scripts/build-wasm.js and should not be modified.
/// <reference lib="dom" />
const hasWebAssembly =
    typeof WebAssembly !== "undefined" &&
    typeof WebAssembly.Module === "function" &&
    typeof WebAssembly.Instance === "function";

const buffer = new Uint8Array([${buffer.join(",")}]);
export default hasWebAssembly ? new WebAssembly.Instance(new WebAssembly.Module(buffer)).exports : undefined;
`.trim();
    try { fs.mkdirSync(path.dirname(mjsOutput), { recursive: true }); } catch { }
    fs.writeFileSync(mjsOutput, text);
}
