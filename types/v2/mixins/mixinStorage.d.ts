import { Mixin, GlobalMixin } from "./types";
/**
 * Utility class for managing mixins and global mixins.
 */
export declare class MixinStorage {
    private static mixins;
    private static globalMixins;
    /**
     * Adds a mixin to the storage.
     * @param mixin The mixin to add.
     */
    static addMixin(mixin: Mixin): void;
    /**
     * Retrieves all mixins stored in the storage.
     * @returns An array of mixins.
     */
    static getMixins(): Mixin[];
    /**
     * Adds a global mixin to the storage.
     * @param mixin The global mixin to add.
     */
    static addGlobalMixin(mixin: GlobalMixin): void;
    /**
     * Retrieves all global mixins stored in the storage.
     * @returns An array of global mixins.
     */
    static getGlobalMixins(): GlobalMixin[];
}
