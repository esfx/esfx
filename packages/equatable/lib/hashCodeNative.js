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

const binary = require("@mapbox/node-pre-gyp");
const path = require("path");
const hashCodeNative = require(binary.find(path.resolve(path.join(__dirname, "../package.json"))));
exports.hashBigInt = hashCodeNative.hashBigInt;
exports.hashNumber = hashCodeNative.hashNumber;
exports.hashString = hashCodeNative.hashString;
exports.hashSymbol = hashCodeNative.hashSymbol;
exports.hashObject = hashCodeNative.hashObject;
