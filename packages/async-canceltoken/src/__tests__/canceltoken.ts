import { create } from "domain";
import { CancelToken, CancelError } from "..";

describe("token", () => {
    it("ctor throws when not a CancelTokenSource", () => {
        expect(() => {
            // @ts-ignore
            new CancelToken();
        }).toThrow(TypeError);
    });
    it("throwIfSignaled when not canceled", () => {
        const source = CancelToken.source();
        const token = source.token;
        expect(() => token.throwIfSignaled()).not.toThrow();
    });
    it("throwIfSignaled when canceled", () => {
        const source = CancelToken.source();
        const token = source.token;
        source.cancel();
        expect(() => token.throwIfSignaled()).toThrow(CancelError);
    });
    it("close", () => {
        const source = CancelToken.source();
        const token = source.token;
        source.close();
        expect(token.canBeSignaled).toBe(false);
        expect(token.signaled).toBe(false);
    });
    it("none", () => {
        const token = CancelToken.none;
        expect(token).toBe(CancelToken.none);
        expect(token.canBeSignaled).toBe(false);
        expect(token.signaled).toBe(false);
    });
    it("register throws when not a function", () => {
        const token = CancelToken.none;
        expect(() => token.subscribe(<any>{})).toThrow(TypeError);
    });
});

describe("subscription", () => {
    it("cancel", () => {
        const source = CancelToken.source();
        const token = source.token;
        const fn = jest.fn();
        token.subscribe(fn);
        source.cancel();
        source.cancel();
        expect(fn).toBeCalledTimes(1);
    });
    it("cancel (after unsubscribed)", () => {
        const source = CancelToken.source();
        const token = source.token;
        const fn = jest.fn();
        const subscription = token.subscribe(fn);
        subscription.unsubscribe();
        source.cancel();
        expect(fn).not.toBeCalled();
    });
    it("close", () => {
        const source = CancelToken.source();
        const token = source.token;
        const fn = jest.fn();
        token.subscribe(fn);
        source.close();
        source.cancel();
        expect(fn).not.toBeCalled();
    });
});

describe("CancelToken.source()", () => {
    it("defaults", () => {
        const source = CancelToken.source();
        expect(source.token).toBeDefined();
        expect(source.token).toBe(source.token);
        expect(source.token.canBeSignaled).toBe(true);
        expect(source.token.signaled).toBe(false);
    });
    it("cancel", () => {
        const source = CancelToken.source();
        source.cancel();
        expect(source.token.canBeSignaled).toBe(true);
        expect(source.token.signaled).toBe(true);
    });
    it("close", () => {
        const source = CancelToken.source();
        source.close();
        expect(source.token.canBeSignaled).toBe(false);
        expect(source.token.signaled).toBe(false);
    });
    it("cancel throws if token subscription throws", (done) => {
        const error = new Error("Error during subscription.");
        const domain = create();
        domain.on("error", e => {
            try {
                expect(e).toBe(error);
                done();
            }
            catch (e) {
                done(e);
            }
        });
        domain.run(() => {
            const source = CancelToken.source();
            const token = source.token;
            token.subscribe(() => { throw error; });
            source.cancel();
        });
    });
    it("register throws when not a function", () => {
        const source = CancelToken.source();
        expect(() => source.token.subscribe(<any>{})).toThrow(TypeError);
    });
});

describe("CancelToken.race()", () => {
    it("linked tokens", () => {
        const source1 = CancelToken.source();
        const source2 = CancelToken.source();
        const token = CancelToken.race([source1.token, source2.token]);
        source1.cancel();
        expect(token.canBeSignaled).toBe(true);
        expect(token.signaled).toBe(true);
        expect(source2.token.canBeSignaled).toBe(true);
        expect(source2.token.signaled).toBe(false);
    });
    it("linked tokens state observed immediately", () => {
        const mainSource = CancelToken.source();
        const tokenA = CancelToken.race([mainSource.token]);
        const tokenB = CancelToken.race([mainSource.token]);
        const tokenAB = CancelToken.race([tokenA, tokenB]);
        let mainSignaled: boolean = false;
        let aSignaled: boolean = false;
        let bSignaled: boolean = false;
        let abSignaled: boolean = false;
        tokenAB.subscribe(() => {
            mainSignaled = mainSource.token.signaled;
            aSignaled = tokenA.signaled;
            bSignaled = tokenB.signaled;
            abSignaled = tokenAB.signaled;
        });
        mainSource.cancel();
        expect(mainSignaled).toBe(true);
        expect(aSignaled).toBe(true);
        expect(bSignaled).toBe(true);
        expect(abSignaled).toBe(true);
    });
    it("error when not a linked token", () => {
        expect(() => CancelToken.race(<any>[{}])).toThrow(TypeError);
    });
    it("linked tokens already canceled", () => {
        const source1 = CancelToken.source();
        source1.cancel();
        const linkedToken = CancelToken.race([source1.token]);
        expect(linkedToken.canBeSignaled).toBe(true);
        expect(linkedToken.signaled).toBe(true);
    });
});

describe("CancelToken.all()", () => {
    it("multiple", () => {
        const source1 = CancelToken.source();
        const source2 = CancelToken.source();
        const token = CancelToken.all([source1.token, source2.token]);
        expect(token.canBeSignaled).toBe(true);
        expect(token.signaled).toBe(false);
        source1.cancel();
        expect(token.canBeSignaled).toBe(true);
        expect(token.signaled).toBe(false);
        source2.cancel();
        expect(token.canBeSignaled).toBe(true);
        expect(token.signaled).toBe(true);
    });
});
