import { create } from "domain";
import { CancelToken, CancelError } from "..";

describe("CancelToken", () => {
    it("constructor throws", () => {
        expect(() => Reflect.construct(CancelToken, [])).toThrow(TypeError);
    });

    describe("static", () => {
        describe("none", () => {
            it("is not signaled", () => expect(CancelToken.none.signaled).toBe(false));
            it("reason is not defined", () => expect(CancelToken.none.reason).toBeUndefined());
            it("cannot be signaled", () => expect(CancelToken.none.canBeSignaled).toBe(false));
        });

        describe("canceled", () => {
            it("is signaled", () => expect(CancelToken.canceled.signaled).toBe(true));
            it("reason is defined", () => expect(CancelToken.canceled.reason).toBeDefined());
            it("can be signaled", () => expect(CancelToken.canceled.canBeSignaled).toBe(true));
        });

        describe("source()", () => {
            it("linked tokens", () => {
                const source1 = CancelToken.source();
                const source2 = CancelToken.source();
                const token = CancelToken.source([source1.token, source2.token]).token;
                source1.cancel();
                expect(token.canBeSignaled).toBe(true);
                expect(token.signaled).toBe(true);
                expect(source2.token.canBeSignaled).toBe(true);
                expect(source2.token.signaled).toBe(false);
            });

            it("linked tokens state observed immediately", () => {
                const mainSource = CancelToken.source();
                const tokenA = CancelToken.source([mainSource.token]).token;
                const tokenB = CancelToken.source([mainSource.token]).token;
                const tokenAB = CancelToken.source([tokenA, tokenB]).token;
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

            it("error when argument not iterable", () => {
                expect(() => CancelToken.source(<any>{})).toThrow(TypeError);
            });

            it("error when element not a token", () => {
                expect(() => CancelToken.source(<any>[{}])).toThrow(TypeError);
            });

            it("linked tokens already canceled", () => {
                const source1 = CancelToken.source();
                source1.cancel();
                const linkedToken = CancelToken.source([source1.token]).token;
                expect(linkedToken.canBeSignaled).toBe(true);
                expect(linkedToken.signaled).toBe(true);
            });

            it("one linked token is closed", () => {
                const source1 = CancelToken.source();
                source1.close();

                const source2 = CancelToken.source();
                const linkedToken = CancelToken.source([source1.token, source2.token]).token;
                expect(linkedToken.canBeSignaled).toBe(true);
                expect(linkedToken.signaled).toBe(false);
            });

            it("all linked tokens are closed", () => {
                const source1 = CancelToken.source();
                source1.close();

                const source2 = CancelToken.source();
                source2.close();

                const linkedToken = CancelToken.source([source1.token, source2.token]).token;
                expect(linkedToken.canBeSignaled).toBe(true);
                expect(linkedToken.signaled).toBe(false);
            });
        });

        describe("race()", () => {
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

            it("error when argument not iterable", () => {
                expect(() => CancelToken.race(<any>{})).toThrow(TypeError);
            });

            it("error when element not a token", () => {
                expect(() => CancelToken.race(<any>[{}])).toThrow(TypeError);
            });

            it("linked tokens already canceled", () => {
                const source1 = CancelToken.source();
                source1.cancel();
                const linkedToken = CancelToken.race([source1.token]);
                expect(linkedToken.canBeSignaled).toBe(true);
                expect(linkedToken.signaled).toBe(true);
            });

            it("one linked token is closed", () => {
                const source1 = CancelToken.source();
                source1.close();

                const source2 = CancelToken.source();
                const linkedToken = CancelToken.race([source1.token, source2.token]);
                expect(linkedToken.canBeSignaled).toBe(true);
                expect(linkedToken.signaled).toBe(false);
            });

            it("all linked tokens are closed", () => {
                const source1 = CancelToken.source();
                source1.close();

                const source2 = CancelToken.source();
                source2.close();

                const linkedToken = CancelToken.race([source1.token, source2.token]);
                expect(linkedToken.canBeSignaled).toBe(false);
                expect(linkedToken.signaled).toBe(false);
            });
        });

        describe("all()", () => {
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

            it("signaled if all linked tokens already canceled", () => {
                const source1 = CancelToken.source();
                source1.cancel();
                const linkedToken = CancelToken.all([source1.token]);
                expect(linkedToken.signaled).toBe(true);
            });

            it("not signaled if not all linked tokens already canceled", () => {
                const source1 = CancelToken.source();
                source1.cancel();
                const source2 = CancelToken.source();
                const linkedToken = CancelToken.all([source1.token, source2.token]);
                expect(linkedToken.signaled).toBe(false);
            });

            it("can be signaled if any linked token is already canceled", () => {
                const source1 = CancelToken.source();
                source1.cancel();
                const linkedToken = CancelToken.all([source1.token]);
                expect(linkedToken.canBeSignaled).toBe(true);
            });

            it("can be signaled if no linked token is canceled or closed", () => {
                const source1 = CancelToken.source();
                const linkedToken = CancelToken.all([source1.token]);
                expect(linkedToken.canBeSignaled).toBe(true);
            });

            it("can be signaled if not all linked tokens are closed", () => {
                const source1 = CancelToken.source();
                const source2 = CancelToken.source();
                source2.close();
                const linkedToken = CancelToken.all([source1.token, source2.token]);
                expect(linkedToken.canBeSignaled).toBe(true);
            });

            it("cannot be signaled if all linked tokens are closed", () => {
                const source1 = CancelToken.source();
                source1.close();

                const source2 = CancelToken.source();
                source2.close();

                const linkedToken = CancelToken.all([source1.token, source2.token]);
                expect(linkedToken.canBeSignaled).toBe(false);
            });
        });

        describe("canceledWith()", () => {
            it("with reason", () => {
                const reason = {};
                const token = CancelToken.canceledWith(reason);
                expect(token.signaled).toBe(true);
                expect(token.reason).toBe(reason);
            });
            it("without reason", () => {
                const token = CancelToken.canceledWith(undefined);
                expect(token.signaled).toBe(true);
                expect(token.reason).toBeInstanceOf(CancelError);
            });
        });

        describe("timeout()", () => {
            it("with reason", () => {
                jest.useFakeTimers();
                const reason = {};
                const token = CancelToken.timeout(10, reason);
                expect(token.signaled).toBe(false);
                expect(token.reason).toBeUndefined();
                jest.advanceTimersByTime(10);
                expect(token.signaled).toBe(true);
                expect(token.reason).toBe(reason);
            });
            it("without reason", () => {
                jest.useFakeTimers();
                const token = CancelToken.timeout(10);
                expect(token.signaled).toBe(false);
                expect(token.reason).toBeUndefined();
                jest.advanceTimersByTime(10);
                expect(token.signaled).toBe(true);
                expect(token.reason).toBeInstanceOf(CancelError);
            });
        });
    });

    describe("instance", () => {
        describe("throwIfSignaled()", () => {
            it("throwIfSignaled when not canceled", () => {
                const source = CancelToken.source();
                const token = source.token;
                expect(() => token.throwIfSignaled()).not.toThrow();
            });
            it("throwIfSignaled when canceled without reason", () => {
                const source = CancelToken.source();
                const token = source.token;
                source.cancel();
                expect(() => token.throwIfSignaled()).toThrow(CancelError);
            });
            it("throwIfSignaled when canceled with reason", () => {
                const source = CancelToken.source();
                const token = source.token;
                class TestError extends Error {}
                source.cancel(new TestError());
                expect(() => token.throwIfSignaled()).toThrow(TestError);
            });
        });

        describe("get signaled()", () => {
            it("is false when not canceled or closed", () => {
                const source = CancelToken.source();
                expect(source.token.signaled).toBe(false);
            });
            it("is true when canceled", () => {
                const source = CancelToken.source();
                source.cancel();
                expect(source.token.signaled).toBe(true);
            });
            it("is false when closed", () => {
                const source = CancelToken.source();
                source.close();
                expect(source.token.signaled).toBe(false);
            });
        });

        describe("get reason()", () => {
            it("is undefined when not canceled or closed", () => {
                const source = CancelToken.source();
                expect(source.token.reason).toBeUndefined();
            });
            it("is undefined when closed", () => {
                const source = CancelToken.source();
                source.close();
                expect(source.token.reason).toBeUndefined();
            });
            it("is defined when canceled", () => {
                const source = CancelToken.source();
                source.cancel();
                expect(source.token.reason).toBeDefined();
            });
            it("is reason when canceled with reason", () => {
                const source = CancelToken.source();
                const reason = {};
                source.cancel(reason);
                expect(source.token.reason).toBe(reason);
            });
            it("is undefined when canceled after closed", () => {
                const source = CancelToken.source();
                source.close();
                source.cancel();
                expect(source.token.reason).toBeUndefined();
            });
        });

        describe("get canBeSignaled()", () => {
            it("is true when not canceled or closed", () => {
                const source = CancelToken.source();
                expect(source.token.canBeSignaled).toBe(true);
            });
            it("is true when canceled", () => {
                const source = CancelToken.source();
                source.cancel();
                expect(source.token.canBeSignaled).toBe(true);
            });
            it("is false when closed", () => {
                const source = CancelToken.source();
                source.close();
                expect(source.token.canBeSignaled).toBe(false);
            });
        });

        describe("subscribe()", () => {
            it("throws when argument not a function", () => {
                const token = CancelToken.none;
                expect(() => token.subscribe(<any>{})).toThrow(TypeError);
            });
            it("callback invoked later when token is canceled later", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                token.subscribe(fn);
                expect(fn).not.toHaveBeenCalled();
                source.cancel();
                expect(fn).toHaveBeenCalledTimes(1);
            });
            it("callback invoked immediately when token already canceled", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                source.cancel();
                token.subscribe(fn);
                expect(fn).toHaveBeenCalledTimes(1);
            });
            it("callback not invoked when token is closed", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                source.close();
                token.subscribe(fn);
                expect(fn).not.toHaveBeenCalled();
            });
            it("callback not invoked when token is canceled after closed", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                source.close();
                source.cancel();
                token.subscribe(fn);
                expect(fn).not.toHaveBeenCalled();
            });
            it("callback invoked once even if source canceled twice", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                token.subscribe(fn);
                source.cancel();
                source.cancel();
                expect(fn).toBeCalledTimes(1);
            });
            it("callback not invoked if source is canceled after unsubscribe", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                const subscription = token.subscribe(fn);
                subscription.unsubscribe();
                source.cancel();
                expect(fn).not.toBeCalled();
            });
            it("callback not invoked if source is closed", () => {
                const source = CancelToken.source();
                const token = source.token;
                const fn = jest.fn();
                token.subscribe(fn);
                source.close();
                source.cancel();
                expect(fn).not.toBeCalled();
            });
        });
    });
});

describe("CancelSource", () => {
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
});

