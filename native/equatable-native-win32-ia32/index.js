/*!
   Copyright 2021 Ron Buckton

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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const hashCodeNative = tryElectron() || tryNode() || fail();
exports.hashBigInt = hashCodeNative.hashBigInt;
exports.hashNumber = hashCodeNative.hashNumber;
exports.hashString = hashCodeNative.hashString;
exports.hashSymbol = hashCodeNative.hashSymbol;
exports.hashObject = hashCodeNative.hashObject;

function tryElectron() {
    if (process.versions.electron) {
        const match = /^(\d+)\.(\d+)/.exec(process.versions.electron);
        if (match) {
            const major = parseInt(match[1], 10);
            let minor = parseInt(match[2], 10);
            while (minor >= 0) {
                const result = tryRequire(`./dist/electron-v${major}.${minor}-${process.platform}-${process.arch}/hashCodeNative.node`);
                if (result) return result;
                minor--;
            }
        }
    }
}

function tryNode() {
    return tryRequire(`./dist/node-v${process.versions.modules}-${process.platform}-${process.arch}/hashCodeNative.node`);
}

function fail() {
    throw new Error("Could not load native helpers.");
}

function tryRequire(id) {
    try {
        return require(id);
    }
    catch {
        return undefined;
    }
}
