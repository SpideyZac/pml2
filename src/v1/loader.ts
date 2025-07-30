/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Base class for all polytrack mods. Mods should export an instance of their mod class named `polyMod` in their main file.
 */
export class PolyMod {
    /**
     * The author of the mod.
     *
     * @type {string}
     */
    get author() {
        return this.modAuthor;
    }
    // @ts-ignore
    modAuthor: string;
    /**
     * The mod ID.
     *
     * @type {string}
     */
    get id() {
        return this.modID;
    }
    // @ts-ignore
    modID: string;
    /**
     * The mod name.
     *
     * @type {string}
     */
    get name() {
        return this.modName;
    }
    // @ts-ignore
    modName: string;
    /**
     * The mod version.
     *
     * @type {string}
     */
    get version() {
        return this.modVersion;
    }
    // @ts-ignore
    modVersion: string;
    /**
     * The the mod's icon file URL.
     *
     * @type {string}
     */
    get iconSrc() {
        return this.IconSrc;
    }
    // @ts-ignore
    IconSrc: string;
    set iconSrc(src) {
        this.IconSrc = src;
    }
    loaded: boolean = false;
    set setLoaded(status: boolean) {
        this.loaded = status;
    }
    /**
     * The mod's loaded state.
     *
     * @type {boolean}
     */
    get isLoaded() {
        return this.loaded;
    }
    /**
     * The mod's base URL.
     *
     * @type {string}
     */
    get baseUrl() {
        return this.modBaseUrl;
    }
    // @ts-ignore
    modBaseUrl: string;
    set baseUrl(url) {
        this.modBaseUrl = url;
    }
    /**
     * Whether the mod has changed the game physics in some way.
     *
     * @type {boolean}
     */
    get touchesPhysics() {
        return this.touchingPhysics;
    }
    // @ts-ignore
    touchingPhysics: boolean;
    /**
     * Other mods that this mod depends on.
     */
    get dependencies() {
        return this.modDependencies;
    }
    // @ts-ignore
    modDependencies: Array<{ version: string; id: string }>;
    get descriptionUrl() {
        return this.modDescription;
    }
    // @ts-ignore
    modDescription: string;
    /**
     * Whether the mod is saved as to always fetch latest version (`true`)
     * or to fetch a specific version (`false`, with version defined by {@link PolyMod.version}).
     *
     * @type {boolean}
     */
    get savedLatest() {
        return this.latestSaved;
    }
    // @ts-ignore
    latestSaved: boolean;
    set savedLatest(latest) {
        this.latestSaved = latest;
    }
    get initialized() {
        return this.modInitialized;
    }
    // @ts-ignore
    modInitialized: boolean;
    set initialized(initState) {
        this.modInitialized = initState;
    }
    // @ts-ignore
    polyVersion: Array<string>;
    // @ts-ignore
    assetFolder: string;
    applyManifest = (manifest: {
        polymod: {
            name: string;
            author: string;
            version: string;
            id: string;
            targets: Array<string>;
        };
        dependencies: Array<{ id: string; version: string }>;
    }) => {
        const mod = manifest.polymod;
        /** @type {string} */
        this.modName = mod.name;
        /** @type {string} */
        this.modID = mod.id;
        /** @type {string} */
        this.modAuthor = mod.author;
        /** @type {string} */
        this.modVersion = mod.version;

        /** @type {string} */
        this.polyVersion = mod.targets;
        this.assetFolder = "assets";
        // no idea how to type annotate this
        // /** @type {{string: string}[]} */
        this.modDependencies = manifest.dependencies;
    };
    /**
     * Function to run during initialization of mods. Note that this is called *before* polytrack itself is loaded,
     * but *after* everything has been declared.
     *
     * @param {PolyModLoader} pmlInstance - The instance of {@link PolyModLoader}.
     */
    init = (pmlInstance: PolyModLoader) => {};
    /**
     * Function to run after all mods and polytrack have been initialized and loaded.
     */
    postInit = () => {};
    /**
     * Function to run before initialization of `simulation_worker.bundle.js`.
     */
    simInit = () => {};
}

/**
 * This class is used in {@link PolyModLoader}'s register mixin functions to set where functions should be injected into the target function.
 */
export enum MixinType {
    /**
     * Inject at the start of the target function.
     */
    HEAD = 0,
    /**
     * Inject at the end of the target function.
     */
    TAIL = 1,
    /**
     * Override the target function with the new function.
     */
    OVERRIDE = 2,
    /**
     * Insert code after a given token.
     */
    INSERT = 3,
    /**
     * Replace code between 2 given tokens. Inclusive.
     */
    REPLACEBETWEEN = 5,
    /**
     * Remove code between 2 given tokens. Inclusive.
     */
    REMOVEBETWEEN = 6,
    /**
     * Inserts code after a given token, but class wide.
     */
    CLASSINSERT = 8,
    /**
     * Replace code between 2 given tokens, but class wide. Inclusive.
     */
    CLASSREMOVE = 4,
    /**
     * Remove code between 2 given tokens, but class wide. Inclusive.
     */
    CLASSREPLACE = 7,
}

export class PolyModLoader {
    #polyVersion: string;
    #allMods: Array<PolyMod>;
    #physicsTouched: boolean;
    #simWorkerClassMixins: Array<{
        scope: string;
        path: string;
        mixinType: MixinType;
        accessors: Array<string> | string;
        funcString: string;
        func2Sstring: string | null;
    }>;
    #simWorkerFuncMixins: Array<{
        path: string;
        mixinType: MixinType;
        accessors: Array<string> | string;
        funcString: string;
        func2Sstring: string | null;
    }>;

    constructor(polyVersion: string) {
        this.#polyVersion = polyVersion;
        this.#allMods = [];
        this.#physicsTouched = false;
        this.#simWorkerClassMixins = [];
        this.#simWorkerFuncMixins = [];
    }
    // @ts-ignore
    localStorage: Storage;
    #polyModUrls: Array<{ base: string; version: string; loaded: boolean }> =
        [];
    initStorage(localStorage: Storage) {
        /** @type {Storage} */
        this.localStorage = localStorage;
        this.#polyModUrls = this.getPolyModsStorage();
    }
    async importMods() {
        const { loadingScreenAPI } = await import("../api");

        loadingScreenAPI.startLoadingScreen(this.#polyModUrls.length);
        for (let polyModObject of this.#polyModUrls) {
            loadingScreenAPI.startImportMod(
                polyModObject.base,
                polyModObject.version
            );

            let latest = false;
            loadingScreenAPI.setCurrentTotalParts(2);
            if (polyModObject.version === "latest") {
                loadingScreenAPI.setCurrentTotalParts(3);
                loadingScreenAPI.startFetchLatest();
                try {
                    const latestFile = await fetch(
                        `${polyModObject.base}/latest.json`
                    ).then((r) => r.json());
                    polyModObject.version = latestFile[this.#polyVersion];
                    latest = true;
                } catch (err) {
                    loadingScreenAPI.errorCurrent();
                    alert(
                        `Couldn't find latest version for ${polyModObject.base}`
                    );
                    console.error(
                        "Error in fetching latest version json:",
                        err
                    );
                }
                loadingScreenAPI.finishFetchLatest(polyModObject.version);
            }
            const polyModUrl = `${polyModObject.base}/${polyModObject.version}`;
            loadingScreenAPI.startFetchManifest();
            try {
                const manifestFile = await fetch(
                    `${polyModUrl}/manifest.json`
                ).then((r) => r.json());
                let mod = manifestFile.polymod;
                loadingScreenAPI.startFetchModMain(mod.main);
                try {
                    const modImport = await import(`${polyModUrl}/${mod.main}`);

                    let newMod = modImport.polyMod;
                    mod.version = polyModObject.version;
                    if (this.getMod(mod.id))
                        alert(`Duplicate mod detected: ${mod.name}`);
                    newMod.applyManifest(manifestFile);
                    newMod.baseUrl = polyModObject.base;
                    newMod.applyManifest = () => {
                        console.warn(
                            "Can't apply manifest after initialization!"
                        );
                    };
                    newMod.savedLatest = latest;
                    newMod.iconSrc = `${polyModUrl}/icon.png`;
                    if (polyModObject.loaded) {
                        newMod.setLoaded = true;
                        if (newMod.touchesPhysics) {
                            this.#physicsTouched = true;
                            this.registerClassMixin(
                                "HB.prototype",
                                "submitLeaderboard",
                                MixinType.OVERRIDE,
                                [],
                                () => {}
                            );
                        }
                    }
                    this.#allMods.push(newMod);
                } catch (err) {
                    loadingScreenAPI.errorCurrent();
                    alert(`Mod ${mod.name} failed to load.`);
                    console.error("Error in loading mod:", err);
                }
            } catch (err) {
                loadingScreenAPI.errorCurrent();
                alert(`Couldn't load mod with URL ${polyModUrl}.`);
                console.error("Error in loading mod URL:", err);
            }

            loadingScreenAPI.finishImportMod();
        }

        loadingScreenAPI.endLoadingScreen();
    }
    getPolyModsStorage() {
        const polyModsStorage = this.localStorage.getItem("polyMods");
        if (polyModsStorage) {
            this.#polyModUrls = JSON.parse(polyModsStorage);
        } else {
            this.#polyModUrls = [
                {
                    base: "https://pml.crjakob.com/polytrackmods/PolyModLoader/0.5.0/pmlcore",
                    version: "latest",
                    loaded: true,
                },
            ];
            this.localStorage.setItem(
                "polyMods",
                JSON.stringify(this.#polyModUrls)
            );
        }
        return this.#polyModUrls;
    }
    serializeMod(mod: PolyMod) {
        return {
            base: mod.baseUrl,
            version: mod.savedLatest ? "latest" : mod.version,
            loaded: mod.isLoaded || false,
        };
    }
    saveModsToLocalStorage() {
        let savedMods: Array<{
            base: string;
            version: string;
            loaded: boolean;
        }> = [];
        for (let mod of this.#allMods) {
            const modSerialized = this.serializeMod(mod);
            savedMods.push(modSerialized);
        }
        this.#polyModUrls = savedMods;
        this.localStorage.setItem(
            "polyMods",
            JSON.stringify(this.#polyModUrls)
        );
    }
    /**
     * Reorder a mod in the internal list to change its priority in mod loading.
     *
     * @param {PolyMod} mod  - The mod to reorder.
     * @param {number} delta - The amount to reorder it by. Positive numbers decrease priority, negative numbers increase priority.
     */
    reorderMod(mod: PolyMod, delta: number) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        const currentIndex = this.#allMods.indexOf(mod);
        if (currentIndex === 1 || delta > 0) return;
        if (currentIndex === null || currentIndex === undefined) {
            alert("This mod isn't loaded");
            return;
        }
        const temp = this.#allMods[currentIndex + delta];
        this.#allMods[currentIndex + delta] = this.#allMods[currentIndex];
        this.#allMods[currentIndex] = temp;
        this.saveModsToLocalStorage();
    }
    /**
     * Add a mod to the internal mod list. Added mod is given least priority.
     *
     * @param polyModObject - The mod's JSON representation to add.
     */
    async addMod(
        polyModObject: { base: string; version: string; loaded: boolean },
        autoUpdate: boolean
    ) {
        let latest = false;
        if (polyModObject.version === "latest") {
            try {
                const latestFile = await fetch(
                    `${polyModObject.base}/latest.json`
                ).then((r) => r.json());
                polyModObject.version = latestFile[this.#polyVersion];
                if (autoUpdate) {
                    latest = true;
                }
            } catch {
                alert(`Couldn't find latest version for ${polyModObject.base}`);
            }
        }
        const polyModUrl = `${polyModObject.base}/${polyModObject.version}`;
        try {
            const manifestFile = await fetch(
                `${polyModUrl}/manifest.json`
            ).then((r) => r.json());
            const mod = manifestFile.polymod;
            if (this.getMod(mod.id)) {
                alert("This mod is already present!");
                return;
            }
            if (mod.targets.indexOf(this.#polyVersion) === -1) {
                alert(
                    `Mod target version does not match polytrack version!
                    Note: ${mod.name} version ${polyModObject.version} targets polytrack versions ${mod.targets.join(", ")}, but current polytrack version is ${this.#polyVersion}.`
                );
                return;
            }
            try {
                const modImport = await import(`${polyModUrl}/${mod.main}`);
                let newMod = modImport.polyMod;
                newMod.iconSrc = `${polyModUrl}/icon.png`;
                mod.version = polyModObject.version;
                newMod.applyManifest(manifestFile);
                newMod.baseUrl = polyModObject.base;
                newMod.applyManifest = () =>
                    console.warn("Can't apply manifest after initialization!");
                newMod.savedLatest = latest;
                polyModObject.loaded = false;
                this.#allMods.push(newMod);
                this.saveModsToLocalStorage();
                return this.getMod(newMod.id);
            } catch (err) {
                alert("Something went wrong importing this mod!");
                console.error("Error in importing mod:", err);
                return;
            }
        } catch (err) {
            alert(`Couldn't find mod manifest for "${polyModObject.base}".`);
            console.error("Error in getting mod manifest:", err);
        }
    }

    /**
     * Remove a mod from the internal list.
     *
     * @param mod - The mod to remove.
     */
    removeMod(mod: PolyMod) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        const index = this.#allMods.indexOf(mod);
        if (index > -1) {
            this.#allMods.splice(index, 1);
        }
        this.saveModsToLocalStorage();
    }
    /**
     * Set the loaded state of a mod.
     *
     * @param mod   - The mod to set the state of.
     * @param state - The state to set. `true` is loaded, `false` is unloaded.
     */
    setModLoaded(mod: PolyMod, state: boolean) {
        if (!mod) return;
        if (mod.id === "pmlcore") {
            return;
        }
        mod.loaded = state;
        this.saveModsToLocalStorage();
    }
    #preInitPML() {
        this.registerFuncMixin(
            "polyInitFunction",
            MixinType.INSERT,
            `, D = 0;`,
            `ActivePolyModLoader.popUpClass = S;`
        );
    }

    initMods() {
        this.#preInitPML();
        let initList: Array<string> = [];
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded) initList.push(polyMod.id);
        }
        if (initList.length === 0) return; // no mods to initialize lol
        let allModsInit = false;
        while (!allModsInit) {
            let currentMod: PolyMod | undefined = this.getMod(initList[0]);
            if (!currentMod) continue;
            console.log(initList[0]);
            let initCheck = true;
            for (let dependency of currentMod.dependencies) {
                let curDependency = this.getMod(dependency.id);
                if (!curDependency) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(
                        `Mod ${currentMod.name} is missing mod ${dependency.id} ${dependency.version} and will not be initialized.`
                    );
                    console.warn(
                        `Mod ${currentMod.name} is missing mod ${dependency.id} ${dependency.version} and will not be initialized.`
                    );
                    break;
                }
                if (!curDependency.isLoaded) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(
                        `Mod ${currentMod.name} depends on mod ${dependency.id} ${dependency.version} but the dependency isn't loaded. Mod will not be initialized.`
                    );
                    console.warn(
                        `Mod ${currentMod.name} depends on mod ${dependency.id} ${dependency.version} but the dependency isn't loaded. Mod will not be initialized.`
                    );
                    break;
                }
                if (curDependency.version !== dependency.version) {
                    initCheck = false;
                    initList.splice(0, 1);
                    alert(
                        `Mod ${currentMod.name} needs version ${dependency.version} of ${curDependency.name} but ${curDependency.version} is present.`
                    );
                    console.warn(
                        `Mod ${currentMod.name} needs version ${dependency.version} of ${curDependency.name} but ${curDependency.version} is present.`
                    );
                    break;
                }
                if (!curDependency.initialized) {
                    initCheck = false;
                    initList.splice(0, 1);
                    initList.push(currentMod.id);
                    break;
                }
            }
            if (initCheck) {
                try {
                    currentMod.init(this);
                    currentMod.initialized = true;
                    initList.splice(0, 1);
                } catch (err) {
                    alert(
                        `Mod ${currentMod.name} failed to initialize and will be unloaded.`
                    );
                    console.error("Error in initializing mod:", err);
                    this.setModLoaded(currentMod, false);
                    initList.splice(0, 1);
                }
            }
            if (initList.length === 0) allModsInit = true;
        }
    }
    postInitMods() {
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded) {
                try {
                    polyMod.postInit();
                } catch (err) {
                    alert(
                        `Mod ${polyMod.name} failed to post initialize and will be unloaded.`
                    );
                    console.error("Error in post initializing mod:", err);
                    this.setModLoaded(polyMod, false);
                }
            }
        }
    }
    simInitMods() {
        for (let polyMod of this.#allMods) {
            if (polyMod.isLoaded) polyMod.simInit();
        }
    }

    /**
     * Access a mod by its mod ID.
     *
     * @param id - The ID of the mod to get
     * @returns  - The requested mod's object.
     */
    getMod(id: string) {
        for (let polyMod of this.#allMods) {
            if (polyMod.id === id) return polyMod;
        }
    }
    /**
     * Get the list of all mods.
     */
    getAllMods() {
        return this.#allMods;
    }
    /**
     * Whether uploading runs to leaderboard is invalid or not.
     */
    get lbInvalid() {
        return this.#physicsTouched;
    }
    get simWorkerClassMixins() {
        return [...this.#simWorkerClassMixins];
    }
    get simWorkerFuncMixins() {
        return [...this.#simWorkerFuncMixins];
    }
    getFromPolyTrack = (path: string): any => {};
    /**
     * Inject mixin under scope {@link scope} with target function name defined by {@link path}.
     * This only injects functions in `main.bundle.js`.
     *
     * @param {string} scope        - The scope under which mixin is injected.
     * @param {string} path         - The path under the {@link scope} which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerClassMixin = (
        scope: string,
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) => {};
    /**
     * Inject mixin with target function name defined by {@link path}.
     * This only injects functions in `main.bundle.js`.
     *
     * @param {string} path         - The path of the function which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerFuncMixin = (
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) => {};
    registerClassWideMixin = (
        path: string,
        mixinType: MixinType,
        firstToken: string,
        funcOrSecondToken: string | Function,
        funcOptional?: Function | string
    ) => {};
    /**
     * Inject mixin under scope {@link scope} with target function name defined by {@link path}.
     * This only injects functions in `simulation_worker.bundle.js`.
     *
     * @param {string} scope        - The scope under which mixin is injected.
     * @param {string} path         - The path under the {@link scope} which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerSimWorkerClassMixin(
        scope: string,
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) {
        this.registerClassMixin(
            "HB.prototype",
            "submitLeaderboard",
            MixinType.OVERRIDE,
            [],
            () => {}
        );
        this.#simWorkerClassMixins.push({
            scope: scope,
            path: path,
            mixinType: mixinType,
            accessors: accessors,
            funcString: typeof func === "function" ? func.toString() : func,
            func2Sstring: extraOptinonal ? extraOptinonal.toString() : null,
        });
    }
    /**
     * Inject mixin with target function name defined by {@link path}.
     * This only injects functions in `simulation_worker.bundle.js`.
     *
     * @param {string} path         - The path of the function which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerSimWorkerFuncMixin(
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) {
        this.registerClassMixin(
            "HB.prototype",
            "submitLeaderboard",
            MixinType.OVERRIDE,
            [],
            () => {}
        );
        this.#simWorkerFuncMixins.push({
            path: path,
            mixinType: mixinType,
            accessors: accessors,
            funcString: typeof func === "function" ? func.toString() : func,
            func2Sstring: extraOptinonal ? extraOptinonal.toString() : null,
        });
    }
}

const ActivePolyModLoader = new PolyModLoader("0.5.0");

export { ActivePolyModLoader };
