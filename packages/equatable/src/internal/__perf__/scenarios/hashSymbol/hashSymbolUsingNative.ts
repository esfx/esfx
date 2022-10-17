/// <reference path="../../../../../package.internal.d.ts" />
import { hashSymbol } from "#hash/native";

export function hashSymbolUsingNativeHashSymbol(x: symbol) {
    return hashSymbol(x);
}
