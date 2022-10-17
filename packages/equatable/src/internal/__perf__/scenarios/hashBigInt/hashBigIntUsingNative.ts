/// <reference path="../../../../../package.internal.d.ts" />
import { hashBigInt } from "#hash/native";

export function hashBigIntUsingNativeHashBigInt(x: bigint) {
    return hashBigInt(x);
}
