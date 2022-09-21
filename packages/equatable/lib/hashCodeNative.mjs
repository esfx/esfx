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

import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";
import binary from "@mapbox/node-pre-gyp";
export const {
    hashBigInt,
    hashNumber,
    hashString,
    hashSymbol,
    hashObject,
    hashUnknown,
} = createRequire(import.meta.url)(binary.find(fileURLToPath(new URL("../package.json", import.meta.url))));