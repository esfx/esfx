/// <reference path="../../../../../package.internal.d.ts" />
import { hashNumber } from "#hash/native";

export function hashNumberUsingNativeHashNumber(x: number) {
    return hashNumber(x);
}
