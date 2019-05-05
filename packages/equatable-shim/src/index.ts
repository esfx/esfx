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

import { hashUnknown, hashString, hashNumber, hashBigInt, hashBoolean, hashSymbol } from '@esfx/internal-hashcode';
import { Equatable, Comparable } from '@esfx/equatable';

const accessorBase: PropertyDescriptor = { enumerable: false, configurable: true };
const methodBase: PropertyDescriptor = { ...accessorBase, writable: true };

// #region Object augmentations

declare global {
    interface Object {
        [Equatable.equals](other: unknown): boolean;
        [Equatable.hash](): number;
    }
}

Object.defineProperties(Object.prototype, {
    [Equatable.equals]: {
        ...methodBase,
        value: function (this: unknown, other: unknown) {
            return Object.is(this, other);
        }
    },
    [Equatable.hash]: {
        ...methodBase,
        value: function (this: unknown) {
            return hashUnknown(this);
        }
    }
});

// #endregion Object augmentations

// #region String augmentations

declare global {
    interface String {
        [Equatable.equals](other: unknown): boolean;
        [Equatable.hash](): number;
        [Comparable.compareTo](other: unknown): number;
    }
}

Object.defineProperties(String.prototype, {
    [Equatable.equals]: {
        ...methodBase,
        value: function (this: string, other: unknown) {
            return this === other;
        }
    },
    [Equatable.hash]: {
        ...methodBase,
        value: function (this: string) {
            return hashString(this);
        }
    },
    [Comparable.compareTo]: {
        ...methodBase,
        value: function (this: string, other: unknown) {
            const s = String(other);
            if (this < s) return -1;
            if (this > s) return 1;
            return 0;
        }
    }
});

// #endregion String augmentations

// #region Symbol augmentations

declare global {
    interface Symbol {
        [Equatable.equals](other: unknown): boolean;
        [Equatable.hash](): number;
    }
}

Object.defineProperties(Symbol.prototype, {
    [Equatable.equals]: {
        ...methodBase,
        value: function (this: symbol, other: unknown) {
            return this === other;
        }
    },
    [Equatable.hash]: {
        ...methodBase,
        value: function (this: symbol) {
            return hashSymbol(this);
        }
    }
});

// #endregion String augmentations

// #region Number augmentations

declare global {
    interface Number extends Comparable {}
}

Object.defineProperties(Number.prototype, {
    [Equatable.equals]: {
        ...methodBase,
        value: function (this: number, other: unknown) {
            return this === other;
        }
    },
    [Equatable.hash]: {
        ...methodBase,
        value: function (this: number) {
            return hashNumber(this);
        }
    },
    [Comparable.compareTo]: {
        ...methodBase,
        value: function (this: number, other: unknown) {
            return this - Number(other);
        }
    }
});

// #endregion Number augmentations

// #region BigInt augmentations

declare global {
    interface BigInt extends Comparable {}
}

if (typeof BigInt === "function") {
    Object.defineProperties(BigInt.prototype, {
        [Equatable.equals]: {
            ...methodBase,
            value: function (this: bigint, other: unknown) {
                return this === other;
            }
        },
        [Equatable.hash]: {
            ...methodBase,
            value: function (this: bigint) {
                return hashBigInt(this);
            }
        },
        [Comparable.compareTo]: {
            enumerable: true,
            configurable: true,
            writable: true,
            value: function (this: bigint, other: unknown) {
                const i = BigInt(other);
                if (this < i) return -1;
                if (this > i) return 1;
                return 0;
            }
        }
    });
}

// #endregion BigInt augmentations

// #region Boolean augmentations

declare global {
    interface Boolean extends Comparable {}
}

Object.defineProperties(Boolean.prototype, {
    [Equatable.equals]: {
        ...methodBase,
        value: function (this: boolean, other: unknown) {
            return this === other;
        }
    },
    [Equatable.hash]: {
        ...methodBase,
        value: function (this: boolean) {
            return hashBoolean(this);
        }
    },
    [Comparable.compareTo]: {
        ...methodBase,
        value: function (this: boolean, other: unknown) {
            const s = Boolean(other);
            if (this < s) return -1;
            if (this > s) return 1;
            return 0;
        }
    }
});

// #endregion Boolean augmentations
