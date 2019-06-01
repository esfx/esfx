import { StructType, int32 } from "@esfx/struct-type";

export const Record = StructType([
    { name: "ready", type: int32 },
    { name: "processed", type: int32 },
] as const);

export function pushStep(steps: Uint8Array, step: number) {
    const offset = Atomics.add(steps, 0, 1) + 1;
    Atomics.store(steps, offset, step);
}

