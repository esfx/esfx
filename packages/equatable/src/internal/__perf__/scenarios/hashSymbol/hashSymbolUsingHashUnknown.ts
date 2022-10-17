import { hashUnknown } from "../../../hashUnknown.js";

export function hashSymbolUsingHashUnknown(x: symbol) {
    return hashUnknown(x);
}
