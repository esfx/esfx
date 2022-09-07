import * as path from "path";
import cjs from "module";
import { Worker as NodeWorker, MessagePort } from "worker_threads";
import { RegisterOptions as TSNodeOptions, TSError } from "ts-node";
import { EventEmitter } from 'events';

export interface WorkerOptions {
    parent?: NodeModule;
    base?: string;
    eval?: boolean | "typescript";
    workerData?: any;
    stdin?: boolean;
    stdout?: boolean;
    stderr?: boolean;
    "ts-node"?: Omit<TSNodeOptions, "readFile" | "writeFile" | "transformers">;
}

const kWorker = Symbol("kWorker");
const kReady = Symbol("kReady");
const kPostMessageQueue = Symbol("kPostMessageQueue");
const kOnMessage = Symbol("kOnMessage");
const kOnMessageError = Symbol("kOnMessageError");
const kOnOnline = Symbol("kOnOnline");
const kOnError = Symbol("kOnError");
const kOnExit = Symbol("kOnExit");

export class Worker extends EventEmitter {
    private [kWorker]: NodeWorker;
    private [kReady]: boolean;
    private [kPostMessageQueue]?: [any, Array<ArrayBuffer | MessagePort>?][];

    constructor(filename: string, options: WorkerOptions = {}) {
        super();
        this[kReady] = options.eval !== "typescript";
        this[kWorker] = new NodeWorker(buildScript(filename, getPathInfo(options, new.target), options), {
            eval: true,
            workerData: options.workerData,
            stdin: options.stdin,
            stdout: options.stdout,
            stderr: options.stderr
        });
        this[kWorker].on("online", () => this[kOnOnline]());
        this[kWorker].on("message", message => this[kOnMessage](message));
        this[kWorker].on("messageerror", err => this[kOnMessageError](err));
        this[kWorker].on("error", err => this[kOnError](err));
        this[kWorker].on("exit", exitCode => this[kOnExit](exitCode));
    }

    get stdin() { return this[kWorker].stdin; }
    get stdout() { return this[kWorker].stdout; }
    get stderr() { return this[kWorker].stderr; }
    get threadId() { return this[kWorker].threadId; }
    get resourceLimits() { return this[kWorker].resourceLimits; }

    postMessage(value: any, transferList?: Array<ArrayBuffer | MessagePort>): void {
        if (!this[kReady]) {
            const queue = this[kPostMessageQueue] || (this[kPostMessageQueue] = []);
            queue.push([value, transferList]);
            return;
        }
        this[kWorker].postMessage(value, transferList);
    }

    terminate(): Promise<number> {
        return this[kWorker].terminate();
    }

    ref() {
        return this[kWorker].ref();
    }
    
    unref() {
        return this[kWorker].unref();
    }

    getHeapSnapshot() {
        return this[kWorker].getHeapSnapshot();
    }

    private [kOnError](error: any) {
        this.emit("error", error);
    }

    private [kOnExit](exitCode: number) {
        this.emit("exit", exitCode);
    }

    private [kOnOnline]() {
        if (this[kReady]) {
            this.emit("online");
        }
    }

    private [kOnMessage](message: any) {
        if (this[kReady]) {
            this.emit("message", message);
            return;
        }
        switch (message.type) {
            case "tsError":
                const error = new TSError(message.diagnosticText, message.diagnosticCodes);
                error.stack = message.stack;
                this.emit("error", error);
                break;
            case "upAndRunning":
                this[kReady] = true;
                this.emit("online");
                const queue = this[kPostMessageQueue];
                if (queue) {
                    this[kPostMessageQueue] = undefined;
                    for (const entry of queue) {
                        this[kWorker].postMessage(entry[0], entry[1]);
                    }
                }
                break;
        }
    }

    private [kOnMessageError](error: Error) {
        this.emit("messageerror", error);
    }
}

export interface Worker {
    addListener(event: "error", listener: (err: any) => void): this;
    addListener(event: "exit", listener: (exitCode: number) => void): this;
    addListener(event: "message", listener: (value: any) => void): this;
    addListener(event: "messageerror", listener: (value: Error) => void): this;
    addListener(event: "online", listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;

    emit(event: "error", err: any): boolean;
    emit(event: "exit", exitCode: number): boolean;
    emit(event: "message", value: any): boolean;
    emit(event: "messageerror", value: any): boolean;
    emit(event: "online"): boolean;
    emit(event: string | symbol, ...args: any[]): boolean;

    on(event: "error", listener: (err: any) => void): this;
    on(event: "exit", listener: (exitCode: number) => void): this;
    on(event: "message", listener: (value: any) => void): this;
    on(event: "messageerror", listener: (value: Error) => void): this;
    on(event: "online", listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;

    once(event: "error", listener: (err: any) => void): this;
    once(event: "exit", listener: (exitCode: number) => void): this;
    once(event: "message", listener: (value: any) => void): this;
    once(event: "messageerror", listener: (value: Error) => void): this;
    once(event: "online", listener: () => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;

    prependListener(event: "error", listener: (err: any) => void): this;
    prependListener(event: "exit", listener: (exitCode: number) => void): this;
    prependListener(event: "message", listener: (value: any) => void): this;
    prependListener(event: "messageerror", listener: (value: Error) => void): this;
    prependListener(event: "online", listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;

    prependOnceListener(event: "error", listener: (err: any) => void): this;
    prependOnceListener(event: "exit", listener: (exitCode: number) => void): this;
    prependOnceListener(event: "message", listener: (value: any) => void): this;
    prependOnceListener(event: "messageerror", listener: (value: Error) => void): this;
    prependOnceListener(event: "online", listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;

    removeListener(event: "error", listener: (err: any) => void): this;
    removeListener(event: "exit", listener: (exitCode: number) => void): this;
    removeListener(event: "message", listener: (value: any) => void): this;
    removeListener(event: "messageerror", listener: (value: Error) => void): this;
    removeListener(event: "online", listener: () => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;

    off(event: "error", listener: (err: any) => void): this;
    off(event: "exit", listener: (exitCode: number) => void): this;
    off(event: "message", listener: (value: any) => void): this;
    off(event: "messageerror", listener: (value: Error) => void): this;
    off(event: "online", listener: () => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;    
}

function buildScript(filename: string, info: ResolverInfo, options: WorkerOptions = {}) {
    return options.eval === "typescript" ? buildTypeScriptEvalScript(filename, info, options) :
        options.eval ? buildEvalScript(filename, info, options) :
        buildFileScript(filename, info, options);
}

function getPathInfo(options: WorkerOptions, stackCrawlMark: Function): ResolverInfo {
    if (options.parent) {
        return { base: path.dirname(options.parent.filename), paths: options.parent.paths };
    }
    let base: string;
    let filename: string | undefined;
    if (options.base) {
        base = path.resolve(options.base);
    }
    else {
        const frames = captureStackTrace(stackCrawlMark);
        const caller = frames[0];
        const callerFileName = caller && caller.getFileName() || undefined;
        if (callerFileName) {
            filename = callerFileName;
            base = path.dirname(filename);
        }
        else {
            base = process.cwd();
        }
    }
    if (!filename) {
        filename = path.join(base, "[path probing]");
    }
    const paths = (cjs as any)._nodeModulePaths(filename);
    return { base, paths };
}

function buildFileScript(filename: string, info: ResolverInfo, options: WorkerOptions) {
    filename = require.resolve(filename, { paths: info.paths });
    return `
require(${JSON.stringify(require.resolve("ts-node"))}).register(${options["ts-node"]});
process.argv[1] = ${JSON.stringify(filename)};
require("module").runMain();
`;
}

function buildEvalScript(text: string, info: ResolverInfo, options: WorkerOptions) {
    const filename = path.join(info.base, "[worker eval]");
    const dirname = info.base;
    const paths = info.paths;
    return `
require(${JSON.stringify(require.resolve("ts-node"))}).register(${options["ts-node"]});
module.filename = ${JSON.stringify(filename)};
module.path = ${JSON.stringify(dirname)};
module.paths = ${JSON.stringify(paths)};
global.__filename = ${JSON.stringify(filename)};
global.__dirname = ${JSON.stringify(dirname)};
global.exports = exports;
global.module = module;
global.require = require;
require("vm").runInThisContext(
    ${JSON.stringify(text)}, {
    filename: ${JSON.stringify(filename)},
    displayErrors: true,
});`;
}

function buildTypeScriptEvalScript(text: string, info: ResolverInfo, options: WorkerOptions) {
    const filename = path.join(info.base, "[worker eval].ts");
    const dirname = info.base;
    const paths = info.paths;
    return `
const { register, TSError } = require(${JSON.stringify(require.resolve("ts-node"))});
const { compile } = register(${JSON.stringify(options["ts-node"])});
module.filename = ${JSON.stringify(filename)};
module.path = ${JSON.stringify(dirname)};
module.paths = ${JSON.stringify(paths)};
global.__filename = ${JSON.stringify(filename)};
global.__dirname = ${JSON.stringify(dirname)};
global.exports = exports;
global.module = module;
global.require = require;
let tsError;
let body;
try {
    body = compile(${JSON.stringify(text)}, ${JSON.stringify(filename)});
}
catch (e) {
    if (e instanceof TSError) {
        tsError = e;
    }
    else {
        throw e;
    }
}
if (tsError) {
    require("worker_threads").parentPort.postMessage({
        type: "tsError",
        diagnosticText: tsError.diagnosticText,
        diagnosticCodes: tsError.diagnosticCodes
    });
}
else {
    require("worker_threads").parentPort.postMessage({ type: "upAndRunning" });
    require("vm").runInThisContext(body, { filename: ${JSON.stringify(filename)}, displayErrors: true });
}
`;
}

interface ResolverInfo {
    base: string;
    paths: string[];
}

function captureStackTrace(stackCrawlMark: Function, skipFrames = 0) {
    const savedPrepareStackTrace = Error.prepareStackTrace;
    try {
        let result: NodeJS.CallSite[] | undefined;
        Error.prepareStackTrace = function (_, callSites) {
            result = callSites.slice(skipFrames);
            return "";
        };
        const dummy: { stack?: any } = {};
        Error.captureStackTrace(dummy, stackCrawlMark);
        void dummy.stack;
        return result || [];
    }
    finally {
        Error.prepareStackTrace = savedPrepareStackTrace;
    }
}
