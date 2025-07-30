/**
 * Base class for all polytrack mods. Mods should export an instance of their mod class named `polyMod` in their main file.
 */
export declare class PolyMod {
    /**
     * The author of the mod.
     *
     * @type {string}
     */
    get author(): string;
    modAuthor: string;
    /**
     * The mod ID.
     *
     * @type {string}
     */
    get id(): string;
    modID: string;
    /**
     * The mod name.
     *
     * @type {string}
     */
    get name(): string;
    modName: string;
    /**
     * The mod version.
     *
     * @type {string}
     */
    get version(): string;
    modVersion: string;
    /**
     * The the mod's icon file URL.
     *
     * @type {string}
     */
    get iconSrc(): string;
    IconSrc: string;
    set iconSrc(src: string);
    loaded: boolean;
    set setLoaded(status: boolean);
    /**
     * The mod's loaded state.
     *
     * @type {boolean}
     */
    get isLoaded(): boolean;
    /**
     * The mod's base URL.
     *
     * @type {string}
     */
    get baseUrl(): string;
    modBaseUrl: string;
    set baseUrl(url: string);
    /**
     * Whether the mod has changed the game physics in some way.
     *
     * @type {boolean}
     */
    get touchesPhysics(): boolean;
    touchingPhysics: boolean;
    /**
     * Other mods that this mod depends on.
     */
    get dependencies(): {
        version: string;
        id: string;
    }[];
    modDependencies: Array<{
        version: string;
        id: string;
    }>;
    get descriptionUrl(): string;
    modDescription: string;
    /**
     * Whether the mod is saved as to always fetch latest version (`true`)
     * or to fetch a specific version (`false`, with version defined by {@link PolyMod.version}).
     *
     * @type {boolean}
     */
    get savedLatest(): boolean;
    latestSaved: boolean;
    set savedLatest(latest: boolean);
    get initialized(): boolean;
    modInitialized: boolean;
    set initialized(initState: boolean);
    polyVersion: Array<string>;
    assetFolder: string;
    applyManifest: (manifest: {
        polymod: {
            name: string;
            author: string;
            version: string;
            id: string;
            targets: Array<string>;
        };
        dependencies: Array<{
            id: string;
            version: string;
        }>;
    }) => void;
    /**
     * Function to run during initialization of mods. Note that this is called *before* polytrack itself is loaded,
     * but *after* everything has been declared.
     *
     * @param {PolyModLoader} pmlInstance - The instance of {@link PolyModLoader}.
     */
    init: (pmlInstance: PolyModLoader) => void;
    /**
     * Function to run after all mods and polytrack have been initialized and loaded.
     */
    postInit: () => void;
    /**
     * Function to run before initialization of `simulation_worker.bundle.js`.
     */
    simInit: () => void;
}
/**
 * This class is used in {@link PolyModLoader}'s register mixin functions to set where functions should be injected into the target function.
 */
export declare enum MixinType {
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
export declare class PolyModLoader {
    #private;
    constructor(polyVersion: string);
    localStorage: Storage;
    initStorage(localStorage: Storage): void;
    importMods(): Promise<void>;
    getPolyModsStorage(): {
        base: string;
        version: string;
        loaded: boolean;
    }[];
    serializeMod(mod: PolyMod): {
        base: string;
        version: string;
        loaded: boolean;
    };
    saveModsToLocalStorage(): void;
    /**
     * Reorder a mod in the internal list to change its priority in mod loading.
     *
     * @param {PolyMod} mod  - The mod to reorder.
     * @param {number} delta - The amount to reorder it by. Positive numbers decrease priority, negative numbers increase priority.
     */
    reorderMod(mod: PolyMod, delta: number): void;
    /**
     * Add a mod to the internal mod list. Added mod is given least priority.
     *
     * @param polyModObject - The mod's JSON representation to add.
     */
    addMod(
        polyModObject: {
            base: string;
            version: string;
            loaded: boolean;
        },
        autoUpdate: boolean
    ): Promise<PolyMod | undefined>;
    /**
     * Remove a mod from the internal list.
     *
     * @param mod - The mod to remove.
     */
    removeMod(mod: PolyMod): void;
    /**
     * Set the loaded state of a mod.
     *
     * @param mod   - The mod to set the state of.
     * @param state - The state to set. `true` is loaded, `false` is unloaded.
     */
    setModLoaded(mod: PolyMod, state: boolean): void;
    initMods(): void;
    postInitMods(): void;
    simInitMods(): void;
    /**
     * Access a mod by its mod ID.
     *
     * @param id - The ID of the mod to get
     * @returns  - The requested mod's object.
     */
    getMod(id: string): PolyMod | undefined;
    /**
     * Get the list of all mods.
     */
    getAllMods(): PolyMod[];
    /**
     * Whether uploading runs to leaderboard is invalid or not.
     */
    get lbInvalid(): boolean;
    get simWorkerClassMixins(): {
        scope: string;
        path: string;
        mixinType: MixinType;
        accessors: Array<string> | string;
        funcString: string;
        func2Sstring: string | null;
    }[];
    get simWorkerFuncMixins(): {
        path: string;
        mixinType: MixinType;
        accessors: Array<string> | string;
        funcString: string;
        func2Sstring: string | null;
    }[];
    getFromPolyTrack: (path: string) => any;
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
    registerClassMixin: (
        scope: string,
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) => void;
    /**
     * Inject mixin with target function name defined by {@link path}.
     * This only injects functions in `main.bundle.js`.
     *
     * @param {string} path         - The path of the function which the mixin targets.
     * @param {MixinType} mixinType - The type of injection.
     * @param {string[]} accessors  - A list of strings to evaluate to access private variables.
     * @param {function} func       - The new function to be injected.
     */
    registerFuncMixin: (
        path: string,
        mixinType: MixinType,
        accessors: string | Array<string>,
        func: Function | string,
        extraOptinonal?: Function | string
    ) => void;
    registerClassWideMixin: (
        path: string,
        mixinType: MixinType,
        firstToken: string,
        funcOrSecondToken: string | Function,
        funcOptional?: Function | string
    ) => void;
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
    ): void;
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
    ): void;
}
declare const ActivePolyModLoader: PolyModLoader;
export { ActivePolyModLoader };
