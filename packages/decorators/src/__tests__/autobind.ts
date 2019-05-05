import { autobind } from "../autobind";

it("autobind method", function f() {
    class C {
        constructor(public name: string) {}
        @autobind
        method() {
            return this.name;
        }
    }

    const c = new C("test");
    const m = c.method;
    expect(m()).toBe("test");
});


it("autobind class", function f() {
    @autobind
    class C {
        constructor(public name: string) {}
        method() {
            return this.name;
        }
    }

    const c = new C("test");
    const m = c.method;
    expect(m()).toBe("test");
});