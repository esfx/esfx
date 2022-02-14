import { Comparer } from "@esfx/equatable";
import { property } from "../common";
import { BinaryOperators, ge, gt, le, lt, max, maxBy, min, minBy, operator, Operators, req, rne, UnaryOperators } from "../operators";

describe("operator()", () => {
    describe("unary", () => {
        it.each`
            op       | operand      | expected
            ${"+"}   | ${1}         | ${1}
            ${"+"}   | ${"1"}       | ${1}
            ${"-"}   | ${1}         | ${-1}
            ${"~"}   | ${0}         | ${-1}
            ${"!"}   | ${true}      | ${false}
            ${"!"}   | ${false}     | ${true}
            ${"!"}   | ${0}         | ${true}
            ${"!"}   | ${1}         | ${false}
        `("$op", <O extends keyof UnaryOperators>({ op, operand, expected }: { operand: any, op: O, expected: any }) => {
            const f: (x: any) => any = operator(op, 1);
            expect(f(operand)).toBe(expected);
        });
    });

    describe("binary", () => {
        it.each`
            left         | op       | right  | expected
            ${1}         | ${"+"}   | ${2}   | ${3}
            ${3}         | ${"-"}   | ${2}   | ${1}
            ${3}         | ${"*"}   | ${2}   | ${6}
            ${3}         | ${"**"}  | ${2}   | ${9}
            ${6}         | ${"/"}   | ${3}   | ${2}
            ${3}         | ${"%"}   | ${2}   | ${1}
            ${1}         | ${"<<"}  | ${1}   | ${2}
            ${2}         | ${">>"}  | ${1}   | ${1}
            ${-2}        | ${">>"}  | ${1}   | ${-1}
            ${-2}        | ${">>>"} | ${1}   | ${2147483647}
            ${3}         | ${"&"}   | ${1}   | ${1}
            ${1}         | ${"|"}   | ${2}   | ${3}
            ${1}         | ${"^"}   | ${2}   | ${3}
            ${1}         | ${"^"}   | ${3}   | ${2}
            ${1}         | ${"&&"}  | ${2}   | ${2}
            ${1}         | ${"&&"}  | ${0}   | ${0}
            ${0}         | ${"&&"}  | ${1}   | ${0}
            ${0}         | ${"&&"}  | ${0}   | ${0}
            ${1}         | ${"||"}  | ${2}   | ${1}
            ${1}         | ${"||"}  | ${0}   | ${1}
            ${0}         | ${"||"}  | ${1}   | ${1}
            ${0}         | ${"||"}  | ${0}   | ${0}
            ${0}         | ${"??"}  | ${1}   | ${0}
            ${null}      | ${"??"}  | ${1}   | ${1}
            ${undefined} | ${"??"}  | ${1}   | ${1}
            ${0}         | ${"<"}   | ${1}   | ${true}
            ${1}         | ${"<"}   | ${1}   | ${false}
            ${1}         | ${"<"}   | ${0}   | ${false}
            ${0}         | ${"<="}  | ${1}   | ${true}
            ${1}         | ${"<="}  | ${1}   | ${true}
            ${1}         | ${"<="}  | ${0}   | ${false}
            ${0}         | ${">"}   | ${1}   | ${false}
            ${1}         | ${">"}   | ${1}   | ${false}
            ${1}         | ${">"}   | ${0}   | ${true}
            ${0}         | ${">="}  | ${1}   | ${false}
            ${1}         | ${">="}  | ${1}   | ${true}
            ${1}         | ${">="}  | ${0}   | ${true}
            ${0}         | ${"=="}  | ${0}   | ${true}
            ${0}         | ${"=="}  | ${"0"} | ${true}
            ${0}         | ${"=="}  | ${1}   | ${false}
            ${0}         | ${"=="}  | ${"1"} | ${false}
            ${0}         | ${"!="}  | ${0}   | ${false}
            ${0}         | ${"!="}  | ${"0"} | ${false}
            ${0}         | ${"!="}  | ${1}   | ${true}
            ${0}         | ${"!="}  | ${"1"} | ${true}
            ${0}         | ${"==="} | ${0}   | ${true}
            ${0}         | ${"==="} | ${"0"} | ${false}
            ${0}         | ${"==="} | ${1}   | ${false}
            ${0}         | ${"==="} | ${"1"} | ${false}
            ${0}         | ${"!=="} | ${0}   | ${false}
            ${0}         | ${"!=="} | ${"0"} | ${true}
            ${0}         | ${"!=="} | ${1}   | ${true}
            ${0}         | ${"!=="} | ${"1"} | ${true}
        `("$op", <O extends keyof BinaryOperators>({ left, op, right, expected }: { left: any, op: O, right: any, expected: any }) => {
            const f: (x: any, y: any) => any = operator(op, 2);
            expect(f(left, right)).toBe(expected);
        });
    });

    describe("unspecified", () => {
        it.each`
            op       | operands   | expected
            ${"+"}   | ${[1]}     | ${1}
            ${"+"}   | ${["1"]}   | ${1}
            ${"+"}   | ${[1, 2]}  | ${3}
            ${"-"}   | ${[1]}     | ${-1}
            ${"-"}   | ${[3, 2]}  | ${1}
        `("$op", <O extends keyof Operators>({ op, operands, expected }: { operands: any[], op: O, expected: any }) => {
            const f: (...args: any[]) => any = operator(op);
            expect(f(...operands)).toBe(expected);
        });
    });
});

interface Holder { x: number }
const holderComparer = Comparer.create<Holder>((a, b) => a.x - b.x);

describe("gt.withComparer()", () => {
    it("uses comparer", () => {
        const f = gt.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 0 })).toBe(true);
        expect(f({ x: 1 }, { x: 1 })).toBe(false);
        expect(f({ x: 0 }, { x: 1 })).toBe(false);
    });
});

describe("ge.withComparer()", () => {
    it("uses comparer", () => {
        const f = ge.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 0 })).toBe(true);
        expect(f({ x: 1 }, { x: 1 })).toBe(true);
        expect(f({ x: 0 }, { x: 1 })).toBe(false);
    });
});

describe("lt.withComparer()", () => {
    it("uses comparer", () => {
        const f = lt.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 0 })).toBe(false);
        expect(f({ x: 1 }, { x: 1 })).toBe(false);
        expect(f({ x: 0 }, { x: 1 })).toBe(true);
    });
});

describe("le.withComparer()", () => {
    it("uses comparer", () => {
        const f = le.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 0 })).toBe(false);
        expect(f({ x: 1 }, { x: 1 })).toBe(true);
        expect(f({ x: 0 }, { x: 1 })).toBe(true);
    });
});

describe("req()", () => {
    it("when equal", () => expect(req(1, 1)).toBe(true));
    it("when inequal", () => expect(req(1, 2)).toBe(false));
});

describe("req.withComparer()", () => {
    it("uses comparer", () => {
        const f = req.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 1 })).toBe(true);
        expect(f({ x: 0 }, { x: 1 })).toBe(false);
    });
});

describe("rne()", () => {
    it("when equal", () => expect(rne(1, 1)).toBe(false));
    it("when inequal", () => expect(rne(1, 2)).toBe(true));
});

describe("rne.withComparer()", () => {
    it("uses comparer", () => {
        const f = rne.withComparer(holderComparer);
        expect(f({ x: 1 }, { x: 1 })).toBe(false);
        expect(f({ x: 0 }, { x: 1 })).toBe(true);
    });
});

describe("min()", () => {
    it("picks min", () => expect(min(0, 1)).toBe(0));
});

describe("min.withComparer()", () => {
    it("uses comparer", () => {
        const f = min.withComparer(holderComparer);
        expect(f({ x: 0 }, { x: 1 })).toEqual({ x: 0 });
    });
});

describe("max()", () => {
    it("picks max", () => expect(max(0, 1)).toBe(1));
});

describe("max.withComparer()", () => {
    it("uses comparer", () => {
        const f = max.withComparer(holderComparer);
        expect(f({ x: 0 }, { x: 1 })).toEqual({ x: 1 });
    });
});

describe("minBy()", () => {
    it("picks min by func", () => expect(minBy({ x: 1 }, { x: 2 }, property("x"))).toEqual({ x: 1 }));
});

describe("minBy.withComparer()", () => {
    it("uses comparer", () => {
        const f = minBy.withComparer(holderComparer);
        expect(f({ x: { x: 0 } }, { x: { x: 1 } }, property("x"))).toEqual({ x: { x: 0 } });
    });
});

describe("maxBy()", () => {
    it("picks max by func", () => expect(maxBy({ x: 1 }, { x: 2 }, property("x"))).toEqual({ x: 2 }));
});

describe("maxBy.withComparer()", () => {
    it("uses comparer", () => {
        const f = maxBy.withComparer(holderComparer);
        expect(f({ x: { x: 0 } }, { x: { x: 1 } }, property("x"))).toEqual({ x: { x: 1 } });
    });
});
