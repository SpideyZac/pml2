import fs from "fs";
import path from "path";

import { applyPatches, parsePatch } from "@sanity/diff-match-patch";
import { isBinaryFileSync } from "isbinaryfile";

/**
 * @typedef {Object} FilePatch
 * @property {string} filePath - The path of the file being patched.
 * @property {'create' | 'delete' | 'modify'} action - The action taken on the file: 'create', 'delete', or 'modify'.
 * @property {string} patchText - The text representation of the patch.
 * @property {'bin' | 'text'} fileType - The type of the file: 'bin' for binary files, 'text' for text files.
 */

/**
 * Applies a series of patches to a file map.
 * @param {{ [filePath: string]: string }} fileMapA - The original file map.
 * @param {FilePatch[][]} filePatches - The patches to apply.
 * @returns The updated file map.
 */
function applyFilePatches(fileMapA, filePatches) {
    const files = { ...fileMapA };

    filePatches.forEach((patchGroup) =>
        patchGroup.forEach(({ filePath, action, patchText, fileType }) => {
            if (action === "delete") {
                delete files[filePath];
            } else {
                // For 'create' and 'modify', we apply the patch to the existing content
                // or an empty string if the file is being created.

                const oldText = files[filePath] ?? "";
                const ps = parsePatch(patchText);
                const res = applyPatches(ps, oldText)[0];

                files[filePath] = res;
                files[filePath + ".type"] = fileType;
            }
        })
    );

    return files;
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
    throw new Error(`Patches directory does not exist: ${PATCHES_DIR}`);
}

const CORE_DIR = path.join(process.cwd(), "core");
if (!fs.existsSync(CORE_DIR)) {
    throw new Error(`Core directory does not exist: ${CORE_DIR}`);
}

const PATCHED_DIR = path.join(process.cwd(), "patched");
if (fs.existsSync(PATCHED_DIR)) {
    fs.rmSync(PATCHED_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PATCHED_DIR, { recursive: true });

const PATCHED_TEMP_DIR = path.join(process.cwd(), "patched-temp");
if (fs.existsSync(PATCHED_TEMP_DIR)) {
    fs.rmSync(PATCHED_TEMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PATCHED_TEMP_DIR, { recursive: true });

let coreFiles = {};
walkDirectory(CORE_DIR, "", coreFiles);

// Get the patches sorted by timestamp
const patchFiles = fs
    .readdirSync(PATCHES_DIR)
    .filter((file) => file.endsWith(".patch"))
    .sort((a, b) => {
        const timeA = parseInt(a.split("-")[0], 10);
        const timeB = parseInt(b.split("-")[0], 10);
        return timeA - timeB;
    });

// Read and parse the patches
const filePatches = patchFiles.map((file) => {
    const filePath = path.join(PATCHES_DIR, file);
    const patchText = fs.readFileSync(filePath, "utf8");
    const patchData = JSON.parse(patchText);

    return patchData;
});

const patchedFiles = applyFilePatches(coreFiles, filePatches);

// Write the patched files to the patched-temp & patched directories
Object.entries(patchedFiles).forEach(([filePath, content]) => {
    if (filePath.endsWith(".type")) return; // Skip type files

    const fullPath = path.join(PATCHED_TEMP_DIR, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (patchedFiles[filePath + ".type"] === "bin") {
        const buffer = Buffer.from(content, "base64");
        fs.writeFileSync(fullPath, buffer);
    } else {
        fs.writeFileSync(fullPath, content, "utf8");
    }
});
Object.entries(patchedFiles).forEach(([filePath, content]) => {
    if (filePath.endsWith(".type")) return; // Skip type files

    const fullPath = path.join(PATCHED_DIR, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (patchedFiles[filePath + ".type"] === "bin") {
        const buffer = Buffer.from(content, "base64");
        fs.writeFileSync(fullPath, buffer);
    } else {
        fs.writeFileSync(fullPath, content, "utf8");
    }
});
