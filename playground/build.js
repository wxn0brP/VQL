import esbuild from "esbuild";

esbuild.build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    outfile: "./dist/index.js",
    platform: "browser",
    format: "esm",
    sourcemap: true,
    minify: true
}).then(() => {
    console.log("Build complete");
}).catch(err => {
    console.error(err);
    process.exit(1);
});
