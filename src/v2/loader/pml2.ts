/* eslint-disable @typescript-eslint/no-namespace */
import { PolyModV2 } from "./mod";
import { PolyVersion } from "../../api/loaderRegistry";

export class PolyModLoaderV2 {
    public modStorage: LoaderImpl.ModStorage;

    constructor() {
        this.modStorage = new LoaderImpl.ModStorage();
    }

    get mods() {
        return this.modStorage.mods;
    }

    initStorage(storage: Storage) {
        this.modStorage.storage = storage;
        if (this.modStorage.storage.getItem("polyModsV2") === null)
            this.modStorage.storage.setItem("polyModsV2", "");
    }
    saveMods() {
        this.modStorage.saveMods();
    }

    async importMods() {
        for (const mod of this.modStorage.storedMods) {
            const data = await LoaderImpl.ImportSystem.fetchManifest(
                mod.baseURL,
                mod.version
            ).catch((e) => {
                alert("Could not fetch manifest of mod.");
                console.error("Error while fetching manifest:", e);
                return null;
            });
            if (data === null) return;

            const polyModV2 = await LoaderImpl.ImportSystem.importMod(
                mod.baseURL,
                data.loadedVersion,
                data.autoUpdate,
                data.manifest
            ).catch((e) => {
                alert("Could not import mod.");
                console.error("Error while importing mod: ", e);
                return null;
            });
            if (polyModV2 === null) return;

            this.modStorage.addMod(polyModV2);
        }
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
            let autoUpdate = false;
            if (version === "latest") {
                autoUpdate = true;
                const latestFile = await fetch(`${modURL}/latest.json`).then(
                    (r) => r.json()
                );
                version = latestFile[PolyVersion];
            }

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

    type SerializedMod = {
        baseURL: string;
        version: string;
        loaded: boolean;
    };
    export class ModStorage {
        mods: PolyModV2[];
        // @ts-expect-error - Initialized by function.
        storage: Storage;

        constructor() {
            this.mods = [];
        }

        get storedMods(): SerializedMod[] {
            return JSON.parse(this.storage.getItem("polyModsV2")!);
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
            this.storage.setItem("polyModsV2", JSON.stringify(serialized));
        }

        addMod(mod: PolyModV2) {
            if (this.mods.findIndex((mod2) => mod.id === mod2.id) !== -1) {
                alert("Mod already exists in list!");
                return;
            }
            this.mods.push(mod);
        }
    }
}
