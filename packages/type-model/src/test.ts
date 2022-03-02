import type { IsAny, IsNever, RequiredKeyof } from ".";

/**
 * A helper type for testing types, used in conjunction with {@link ExpectType}:
 *
 * ```ts
 * // test suite:
 * type _ = [
 *   Test<ExpectType<Actual, Expected>>,
 * ];
 * ```
 */
export type Test<T extends { pass: true }> = T;

/**
 * A helper type for testing types, used in conjunction with {@link Test}:
 *
 * ```ts
 * // test suite:
 * type _ = [
 *   Test<ExpectType<Actual, Expected>>
 * ];
 * ```
 */
export type ExpectType<Actual, Expected> =
   [IsNever<Expected>] extends [true] ? [IsNever<Actual>] extends [true] ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
   [IsNever<Actual>] extends [true] ? { pass: false, Expected: Expected, Actual: Actual } :
   [IsAny<Expected>] extends [true] ? [IsAny<Actual>] extends [true] ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
   [IsAny<Actual>] extends [true] ? { pass: false, Expected: Expected, Actual: Actual } :
   [Expected, Actual, RequiredKeyof<Expected>, RequiredKeyof<Actual>] extends [Actual, Expected, RequiredKeyof<Actual>, RequiredKeyof<Expected>] ? { pass: true } :
   { pass: false, Expected: Expected, Actual: Actual };
