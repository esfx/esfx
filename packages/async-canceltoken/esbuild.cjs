const { build } = require('esbuild');
build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    outdir: "dist",
    format: "cjs",
    sourcemap: true,
    external: ["@esfx/cancelable", "@esfx/disposable"]
}).catch(e => { console.error(e); process.exit(1); });