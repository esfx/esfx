declare module "jest-performance" {
    global {
        namespace jest {
            interface Matchers<R> {
                benchmark(racers: Record<string, () => void>): Promise<R>;
            }
        }
    }
}