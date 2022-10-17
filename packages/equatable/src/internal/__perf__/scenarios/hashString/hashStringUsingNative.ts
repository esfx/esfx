/// <reference path="../../../../../package.internal.d.ts" />
import { hashString } from "#hash/native";

export function hashStringUsingNativeHashString(x: string) {
    return hashString(x);
}
