import fs from "fs";
import path from "path";

import { buildSync } from "esbuild";

const distPath = path.resolve("dist-pml2");
const main = "temp.js";

const debug = process.argv.includes("--debug");

/**
 * Bundles the PML2 library into a single file.
 */
function bundle() {
    let outFolder;
    if (debug) {
        outFolder = path.join(distPath, "debug");
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder, { recursive: true });
        }
    } else {
        outFolder = path.join(distPath, "release");
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder, { recursive: true });
        }
    }

    buildSync({
        entryPoints: [path.join(distPath, main)],
        outfile: path.join(outFolder, "pml2.js"),
        bundle: true,
        minify: !debug,
        format: "esm",
        target: "es2020",
        sourcemap: debug ? "linked" : false,
        logLevel: "info",
        allowOverwrite: true,
    });

    fs.readdirSync(distPath).forEach((file) => {
        if (file.endsWith(".js")) {
            fs.unlinkSync(path.join(distPath, file));
        }
    });

    if (debug) {
        fs.readdirSync(distPath).forEach((file) => {
            if (file.endsWith(".js.map")) {
                fs.unlinkSync(path.join(distPath, file));
            }
        });
    }
}

bundle();
