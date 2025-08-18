/* eslint-disable @typescript-eslint/no-namespace */
import diff from "semver/functions/diff";

import { PolyModV2 } from "./mod";

import { PolyVersion } from "../../api/loaderRegistry";
import { loadingScreenAPI } from "../../api";

import { MixinStorage } from "../mixins";

type SerializedMod = {
    baseURL: string;
    version: string;
    loaded: boolean;
};

export class PolyModLoaderV2 {
    private mods: PolyModV2[];
    // @ts-expect-error - Initialized by function
    private modStorage: Storage;
    private mainMixinStorage = new MixinStorage();
    private simMixinStorage = new MixinStorage();

    constructor() {
        this.mods = [];
    }

    initStorage(storage: Storage) {
        this.modStorage = storage;
        if (this.modStorage.getItem("polyModsV2") === null)
            this.modStorage.setItem("polyModsV2", "");
    }

    get storedMods(): SerializedMod[] {
        return JSON.parse(this.modStorage.getItem("polyModsV2")!);
    }
    saveMods() {
        const serialized: SerializedMod[] = [];
        for (const mod of this.mods) {
            serialized.push({
                baseURL: mod.baseUrl,
                version: mod.version,
                loaded: mod.loaded,
            });
        }
        this.modStorage.setItem("polyModsV2", JSON.stringify(serialized));
    }

    addMod(mod: PolyModV2) {
        if (this.mods.findIndex((mod2) => mod.id === mod2.id) !== -1) {
            alert("Mod already exists in list!");
            return;
        }
        this.mods.push(mod);
    }

    getMod(id: string): PolyModV2 | undefined {
        return this.mods.find((mod) => mod.id === id);
    }

    async importMods() {
        loadingScreenAPI.startLoadingScreen(this.storedMods.length);

        for (const mod of this.storedMods) {
            loadingScreenAPI.startImportMod(mod.baseURL, mod.version);

            const data = await LoaderImpl.ImportSystem.fetchManifest(
                mod.baseURL,
                mod.version
            ).catch((e) => {
                loadingScreenAPI.errorCurrent();
                alert("Could not fetch manifest of mod.");
                console.error("Error while fetching manifest:", e);
                return null;
            });
            if (data === null) continue;

            const polyModV2 = await LoaderImpl.ImportSystem.importMod(
                mod.baseURL,
                data.loadedVersion,
                data.autoUpdate,
                data.manifest
            ).catch((e) => {
                loadingScreenAPI.errorCurrent();
                alert("Could not import mod.");
                console.error("Error while importing mod: ", e);
                return null;
            });
            if (polyModV2 === null) continue;

            this.addMod(polyModV2);
            loadingScreenAPI.finishImportMod();
        }

        loadingScreenAPI.endLoadingScreen();
    }

    setupMods() {
        for (const mod of this.mods)
            LoaderImpl.InitSystem.initMod(
                this,
                mod,
                this.mainMixinStorage,
                this.simMixinStorage
            );
        for (const mod of this.mods) mod.postInit();
    }
}

namespace LoaderImpl {
    // TODO: loading screen stuff in the imports
    export namespace ImportSystem {
        type Manifest = {
            polymod: {
                name: string;
                id: string;
                author: string;
                targets: string[];
                main: string;
            };
            dependencies: Array<{
                id: string;
                version: string;
            }>;
        };
        export async function fetchManifest(
            modURL: string,
            version: string | "latest"
        ): Promise<{
            manifest: Manifest;
            autoUpdate: boolean;
            loadedVersion: string;
        }> {
            loadingScreenAPI.setCurrentTotalParts(2);
            let autoUpdate = false;
            if (version === "latest") {
                loadingScreenAPI.setCurrentTotalParts(3);
                loadingScreenAPI.startFetchLatest();

                autoUpdate = true;
                const latestFile = await fetch(`${modURL}/latest.json`).then(
                    (r) => r.json()
                );
                version = latestFile[PolyVersion];

                loadingScreenAPI.finishFetchLatest(version);
            }

            loadingScreenAPI.startFetchManifest();
            return {
                manifest: await fetch(
                    `${modURL}/${version}/manifest.json`
                ).then((r) => r.json()),
                autoUpdate: autoUpdate,
                loadedVersion: version,
            };
        }

        export async function importMod(
            headURL: string,
            version: string,
            autoUpdate: boolean,
            manifest: Manifest
        ): Promise<PolyModV2> {
            loadingScreenAPI.startFetchModMain(
                `${headURL}/${version}/${manifest.polymod.main}`
            );

            const modJS = await import(
                `${headURL}/${version}/${manifest.polymod.main}`
            );
            if (modJS.polyModV2 !== undefined) {
                const polyModV2: PolyModV2 = modJS.polyModV2;

                // Init with manifest data
                polyModV2.useLatest = autoUpdate;
                polyModV2.name = manifest.polymod.name;
                polyModV2.id = manifest.polymod.id;
                polyModV2.author = manifest.polymod.author;
                polyModV2.version = version;
                polyModV2.description = await fetch(
                    `${headURL}/${version}/description.html`
                )
                    .then((r) => r.text())
                    .catch(() => "");
                polyModV2.polyVersions = manifest.polymod.targets;
                polyModV2.baseUrl = headURL;

                return polyModV2;
            }
            return Promise.reject("Mod does not export a V2 mod instance!");
        }
    }

    export namespace InitSystem {
        export function initMod(
            loader: PolyModLoaderV2,
            mod: PolyModV2,
            mainMixinStorage: MixinStorage,
            simMixinStorage: MixinStorage
        ) {
            // Dont initialize a mod twice.
            if (mod.initialized) return;

            // Initialize all dependencies first
            for (const dep of mod.dependencies) {
                const depMod = loader.getMod(dep.id);
                if (depMod === undefined) {
                    // TODO: Do something if dependency does not exist.
                    //       Perhaps a popup for importing the dependency mod?
                    return;
                }

                // Make sure dependency version is acceptable for what the mod requires
                const difference = diff(dep.version, depMod.version);
                // A patch version change should affect nothing (unless this mod intentionally uses a bug in the dependency mod, in which case wtf).
                // A minor version change might deprecate some functions, introduce new functions, etc. But the API this mod uses should stay the same so it is fine.
                // A major version change could do anything, it is NOT fine.
                if (difference === "major" || difference === "premajor") {
                    // TODO: Some error screen or something
                    return;
                }

                initMod(loader, depMod, mainMixinStorage, simMixinStorage);
            }

            try {
                mod.registerMixins(mainMixinStorage, simMixinStorage);

                mod.init(loader);
                mod.initialized = true;
            } catch {
                // TODO
            }
        }
    }
}
