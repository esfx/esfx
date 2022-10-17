import { randomInt } from "crypto";
import { randomString } from "./randomStrings";
import { inRange, Range } from "./range";

export const SAMPLE_SIZE = 10_000;

const PERCENT_BUILTIN: Range =    [0.15, 0.17, "[)"];
const PERCENT_REGISTERED: Range = [0,    0.15, "[)"];

const builtinSymbols: symbol[] = [];
for (const key of Object.getOwnPropertyNames(Symbol)) {
    if (typeof key === "string") {
        const value = (Symbol as any)[key];
        if (typeof value === "symbol") {
            builtinSymbols.push(value);
        }
    }
}

function randomRegisteredSymbol() {
    return Symbol.for(randomString());
}

function randomLocalSymbol() {
    return Symbol(randomString());
}

function randomBuiltinSymbol() {
    return builtinSymbols[randomInt(builtinSymbols.length - 1)];
}

function randomSymbolKind() {
    const x = Math.random();
    return inRange(x, PERCENT_REGISTERED) ? "registered" :
        inRange(x, PERCENT_BUILTIN) ? "builtin" :
        "local";
}

export function randomSymbol(kind: "registered" | "builtin" | "local" = randomSymbolKind()) {
    return kind === "registered" ? randomRegisteredSymbol() :
        kind === "builtin" ? randomBuiltinSymbol() :
        randomLocalSymbol();
}

export function generateRandomSymbols() {
    const randomSymbols: symbol[] = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        randomSymbols[i] = randomSymbol();
    }
    return randomSymbols;
}
