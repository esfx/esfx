module.exports = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    outdir: "dist",
    format: "cjs",
    sourcemap: true,
    external: [
        "@esfx/cancelable",
    ]
};