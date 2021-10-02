/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

function tryGetNodeDeprecate() {
    try {
        const util = require('util') as typeof import('util');
        return util.deprecate;
    }
    catch {
    }
}

function createDeprecateCore() {
    const emitWarning: (warning: string | Error, type?: string, ctor?: Function) => void = 
        typeof process === "object" && typeof process.emitWarning === "function" ? function emitWarning(warning, type = "Warning", ctor = emitWarning) {
            process.emitWarning(warning, type, ctor);
        } :
        typeof Error.captureStackTrace === "function" ? function emitWarning(warning, type = "Warning", ctor = emitWarning) {
            if (typeof warning === "string") {
                warning = new Error(warning);
                warning.name = type;
            }
            Error.captureStackTrace(warning, ctor);
            console.warn(warning);
        } :
        function emitWarning(warning, type = "Warning") {
            if (typeof warning === "string") {
                console.warn(`${type}:`, warning);
            }
            else {
                console.warn(warning);
            }
        };

    return <T extends Function>(fn: T, msg: string): T => {
        let warned = false;
        function deprecated(this: unknown, ...args: any[]) {
            if (!warned) {
                warned = true;
                emitWarning(msg, 'DeprecationWarning', fn);
            }
            return new.target ? Reflect.construct(fn, args, new.target) : fn.apply(this, args);
        }
        Object.setPrototypeOf(deprecated, fn);
        if (fn.prototype) deprecated.prototype = fn.prototype;
        return deprecated as Function as typeof fn;
    };
}

const deprecateCore = tryGetNodeDeprecate() || createDeprecateCore();

/** @internal */
export function deprecate<T extends Function>(fn: T, message: string): T {
    return deprecateCore(fn, message);
}

/** @internal */
export function deprecateProperty<T, K extends keyof T>(target: T, key: K, message: string) {
    let descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && descriptor.configurable) {
        let changed = false;
        if (descriptor.get) {
            descriptor.get = deprecate(descriptor.get, message);
            changed = true;
        }
        if (descriptor.set) {
            descriptor.set = deprecate(descriptor.set, message);
            changed = true;
        }
        if (typeof descriptor.value === "function") {
            descriptor.value = deprecate(descriptor.value, message);
            changed = true;
        }
        if (changed) {
            Object.defineProperty(target, key, descriptor);
        }
    }
    return target;
}