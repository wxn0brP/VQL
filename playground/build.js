import esbuild from "esbuild";
import { existsSync, readFileSync, writeFileSync } from "fs";

const loggerFile = "../node_modules/@wxn0brp/wts-logger/transports/file.js";
const hasUpdate = existsSync(loggerFile + ".modified");
if (!hasUpdate) {
    writeFileSync(loggerFile,
        readFileSync(loggerFile, "utf-8")
            .split("\n")
            .slice(2)
            .join("\n")
    )
    writeFileSync(loggerFile + ".modified", "");
}

esbuild.build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    outfile: "./dist/index.js",
    platform: "browser",
    format: "esm",
    sourcemap: true,
    minify: true,
}).then(() => {
    console.log("Build complete");
}).catch(err => {
    console.error(err);
    process.exit(1);
});
