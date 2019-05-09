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
interface Counter {
    next: number;
}
export declare function hashBoolean(x: boolean): 1 | 0;
export declare function hashNumber(x: number): number;
export declare function combineHashes(x: number, y: number): number;
export declare const hashBigInt: (x: bigint) => number;
export declare function hashString(x: string): number;
export declare function hashSymbol(x: symbol): number;
export declare function hashObject(x: object): number;
export declare function hashUnknown(x: unknown): number;
export declare namespace hashUnknown {
    var getState: () => {
        weakPrototypeCounters: WeakMap<object, Counter> | undefined;
        nullPrototypeCounter: Counter | undefined;
        localSymbolCounter: Counter | undefined;
        weakObjectHashes: WeakMap<object, number> | undefined;
        globalSymbolHashes: Map<symbol, number> | undefined;
        localSymbolHashes: Map<symbol, number> | undefined;
        objectSeed: number;
        stringSeed: number;
        bigIntSeed: number;
        localSymbolSeed: number;
        globalSymbolSeed: number;
    };
    var setState: (state: Partial<{
        weakPrototypeCounters: WeakMap<object, Counter> | undefined;
        nullPrototypeCounter: Counter | undefined;
        localSymbolCounter: Counter | undefined;
        weakObjectHashes: WeakMap<object, number> | undefined;
        globalSymbolHashes: Map<symbol, number> | undefined;
        localSymbolHashes: Map<symbol, number> | undefined;
        objectSeed: number;
        stringSeed: number;
        bigIntSeed: number;
        localSymbolSeed: number;
        globalSymbolSeed: number;
    }>) => Partial<{
        weakPrototypeCounters: WeakMap<object, Counter> | undefined;
        nullPrototypeCounter: Counter | undefined;
        localSymbolCounter: Counter | undefined;
        weakObjectHashes: WeakMap<object, number> | undefined;
        globalSymbolHashes: Map<symbol, number> | undefined;
        localSymbolHashes: Map<symbol, number> | undefined;
        objectSeed: number;
        stringSeed: number;
        bigIntSeed: number;
        localSymbolSeed: number;
        globalSymbolSeed: number;
    }>;
}
export {};
//# sourceMappingURL=index.d.ts.map