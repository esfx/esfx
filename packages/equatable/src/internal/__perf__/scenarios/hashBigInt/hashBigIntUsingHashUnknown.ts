import { hashUnknown } from "../../../hashUnknown.js";

export function hashBigIntUsingHashUnknown(x: bigint) {
    return hashUnknown(x);
}
