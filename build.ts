import esbuild from "esbuild";

esbuild.build({
    entryPoints: [
        "src/index.ts"
    ],
    outdir: "dist-browser",
    format: "esm",
    target: "es2022",
    bundle: true,
    splitting: false,
    minify: true,
    external: ["fs", "crypto", "@wxn0brp/db-core"],
}).catch(() => process.exit(1));