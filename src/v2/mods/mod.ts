import { MixinStorage } from "../mixins";

/**
 * Abstract class for mods in the PolyMod V2 system.
 */
export abstract class PolyModV2 {
    /**
     * Whether the mod is initialized.
     */
    public initialized: boolean = false;
    /**
     * Whether the mod is loaded.
     */
    public loaded: boolean = false;
    /**
     * Whether the mod uses/fetches the latest version of itself.
     * This is used to determine if the mod should check for updates.
     */
    public useLatest: boolean = false;

    /**
     * The name of the mod.
     */
    public name: string = "";
    /**
     * The ID of the mod.
     * This is used to identify the mod and should be unique.
     */
    public id: string = "";
    /**
     * The author of the mod.
     */
    public author: string = "";
    /**
     * The version of the mod.
     * This should follow semantic versioning (MAJOR.MINOR.PATCH).
     * For example: "1.0.0", "2.1.3", "0.9.8", etc.
     */
    public version: string = "";
    /**
     * The description of the mod.
     * This is in HTML.
     */
    public description: string = "";
    /**
     * The PolyTrack versions that the mod supports.
     * This is used to determine if the mod is compatible with the current version of PolyTrack.
     * For example: ["1.0.0", "1.1.0", "2.0.0"].
     */
    public polyVersions: string[] = [];
    /**
     * The dependencies of the mod.
     * This is an array of objects with the ID and version of the dependency.
     * For example: [{ id: "mod-id", version: "1.0.0" }].
     */
    public dependencies: Array<{ id: string; version: string }> = [];

    /**
     * The base URL of the mod.
     * This is used to load assets and other resources.
     */
    public baseUrl: string = "";

    /**
     * Whether the mod modifies the physics of the game.
     * This is used to determine if the leaderboard should be disabled (as the player is effectively cheating).
     */
    public modifiesPhysics: boolean = false;

    /**
     * Register mixins for the mod.
     * This is called when the mod is loaded.
     * @param {MixinStorage} mainStorage - The main bundle mixin storage.
     * @param {MixinStorage} simStorage - The simulation bundle mixin storage.
     */
    public abstract registerMixins(
        mainStorage: MixinStorage,
        simStorage: MixinStorage
    ): void;
    // TODO: add pml type
    /**
     * Initialize the mod with the PolyMod instance.
     * This is called after the mixins are registered.
     * @param {any} pmlInstance - The PolyMod instance.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract init(pmlInstance: any): void;
    /**
     * This is called after every mod is initialized.
     */
    public abstract postInit(): void;
}
