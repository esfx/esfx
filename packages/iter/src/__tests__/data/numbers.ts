import { HierarchyProvider } from "../..";

export const numberHierarchy: HierarchyProvider<number> = {
    owns(_: number) { return true; },
    parent(): number { return undefined!; },
    children(): number[] { return undefined!; }
};