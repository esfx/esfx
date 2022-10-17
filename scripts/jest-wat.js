// @ts-check
const fs = require("fs");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const thisFileContents = fs.readFileSync(__filename, "utf8");

class Transformer {
    #esm;

    constructor(esm = false) {
        this.#esm = esm;
    }

    process(content, filename, options) {
        const esm = options.transformerConfig?.esm ?? this.#esm;
        const wasmOptBin = require.resolve(`wasm-opt/bin/wasm-opt${process.platform === 'win32' ? ".exe" : ""}`);
        const { stdout, stderr, status } = spawnSync(wasmOptBin, ["-q", "--enable-bulk-memory", "-O4", "-", "-o", "-"], { input: content, stdio: "pipe" });
        if (status) {
            throw new Error(stderr.toString("utf8"));
        }
        else {
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
            const code = esm ?
                `export default new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([${buffer.join(",")}]))).exports;` :
                `exports.default = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([${buffer.join(",")}]))).exports;Object.defineProperty(exports, "__esModule", { value: true });`;
            return { code };
        }
    }

    getCacheKey(content, filename, options) {
        return crypto
            .createHash("SHA1")
            .update(__filename, "utf8").update(thisFileContents, "utf8")
            .update(filename, "utf8").update(content, "utf8")
            .update(options.configString ?? "", "utf8")
            .digest()
            .toString("base64");
    }
}

module.exports = {
    createTransformer({ esm = false } = {}) { return new Transformer(esm); },
    process(...args) { return new Transformer().process(...args); },
    getCacheKey(...args) { return new Transformer().getCacheKey(...args); },
};
