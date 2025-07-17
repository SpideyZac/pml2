import fs from "fs";
import path from "path";

import { makePatches, stringifyPatches } from "@sanity/diff-match-patch";
import { isBinaryFileSync } from "isbinaryfile";

if (process.argv.length < 3) {
    console.error("Usage: node ./scripts/createPatch.js <patch-name>");
    process.exit(1);
}

/**
 * @typedef {Object} FilePatch
 * @property {string} filePath - The path of the file being patched.
 * @property {'create' | 'delete' | 'modify'} action - The action taken on the file: 'create', 'delete', or 'modify'.
 * @property {string} patchText - The text representation of the patch.
 * @property {'bin' | 'text'} fileType - The type of the file: 'bin' for binary files, 'text' for text files.
 */

/**
 * Creates a patch between two file maps.
 *
 * The file maps are objects where the keys are file paths and the values are the file contents.
 * @param {{ [filePath: string]: string }} fileMapA The original file map.
 * @param {{ [filePath: string]: string }} fileMapB The modified file map.
 * @return {FilePatch[]} An array of file patches, each containing the file path, action, and patch text.
 */
function buildFilePatches(fileMapA, fileMapB) {
    const patches = [];
    const allFilePaths = new Set([
        ...Object.keys(fileMapA),
        ...Object.keys(fileMapB),
    ]);

    allFilePaths.forEach((filePath) => {
        if (filePath.endsWith(".type")) return; // Skip type files

        const contentA = fileMapA[filePath] ?? "";
        const contentB = fileMapB[filePath] ?? "";

        if (!fileMapA[filePath]) {
            // File was created in fileMapB

            // We compare against an empty string to represent a new file (i.e. the original content is empty)
            const p = makePatches("", contentB);
            patches.push({
                filePath,
                action: "create",
                patchText: stringifyPatches(p),
                fileType: fileMapB[filePath + ".type"],
            });
        } else if (!fileMapB[filePath]) {
            // File was deleted in fileMapB

            // We compare against the current content to represent a deletion
            const p = makePatches(contentA, "");
            patches.push({
                filePath,
                action: "delete",
                patchText: stringifyPatches(p),
                fileType: fileMapA[filePath + ".type"],
            });
        } else if (contentA !== contentB) {
            // File was modified in fileMapB
            const p = makePatches(contentA, contentB);
            patches.push({
                filePath,
                action: "modify",
                patchText: stringifyPatches(p),
                fileType: fileMapB[filePath + ".type"],
            });
        }
    });

    return patches;
}

/**
 * Walks through a directory and its subdirectories, populating a file map with the contents of all files.
 * @param {string} dir The directory to walk through.
 * @param {string} relPath The relative path of the current directory (used for maintaining file structure).
 * @param {Object} fileMap The file map to populate with file contents.
 */
function walkDirectory(dir, relPath, fileMap) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const newRelPath = path.join(relPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDirectory(fullPath, newRelPath, fileMap);
        } else {
            if (isBinaryFileSync(fullPath)) {
                fileMap[newRelPath] = fs
                    .readFileSync(fullPath)
                    .toString("base64");
                fileMap[newRelPath + ".type"] = "bin";
            } else {
                fileMap[newRelPath] = fs.readFileSync(fullPath, "utf8");
                fileMap[newRelPath + ".type"] = "text";
            }
        }
    });
}

const PATCHES_DIR = path.join(process.cwd(), "patches");
if (!fs.existsSync(PATCHES_DIR)) {
    fs.mkdirSync(PATCHES_DIR, { recursive: true });
}

const CORE_DIR = path.join(process.cwd(), "patched-temp");
if (!fs.existsSync(CORE_DIR)) {
    throw new Error(`Core directory does not exist: ${CORE_DIR}`);
}

const BUILD_DIR = path.join(process.cwd(), "patched");
if (!fs.existsSync(BUILD_DIR)) {
    throw new Error(`Build directory does not exist: ${BUILD_DIR}`);
}

let coreFiles = {};
let buildFiles = {};

walkDirectory(CORE_DIR, "", coreFiles);
walkDirectory(BUILD_DIR, "", buildFiles);

const patchName = `${Date.now()}-${process.argv[2]}.patch`;
const patchFilePath = path.join(PATCHES_DIR, patchName);
const filePatches = buildFilePatches(coreFiles, buildFiles);

fs.writeFileSync(patchFilePath, JSON.stringify(filePatches));

console.log(`Patch created: ${patchFilePath}`);
console.log(`Number of files patched: ${filePatches.length}`);
console.log(`Patch name: ${patchName}`);
