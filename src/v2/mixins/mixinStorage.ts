import { Mixin, GlobalMixin } from "./types";
import {
    HeadMixinApplier,
    TailMixinApplier,
    InsertMixinApplier,
    GlobalMixinApplier,
} from "./mixinAppliers";


/**
 * Utility class for managing mixins and global mixins.
 */
export class MixinStorage {
    private static mixins: Mixin[] = [];
    private static globalMixins: GlobalMixin[] = [];

    /**
     * Adds a mixin to the storage.
     * @param mixin The mixin to add.
     */
    static addMixin(mixin: Mixin): void {
        this.mixins.push(mixin);
    }

    /**
     * Retrieves all mixins stored in the storage.
     * @returns An array of mixins.
     */
    static getMixins(): Mixin[] {
        return this.mixins;
    }

    /**
     * Adds a global mixin to the storage.
     * @param mixin The global mixin to add.
     */
    static addGlobalMixin(mixin: GlobalMixin): void {
        this.globalMixins.push(mixin);
    }

    /**
     * Retrieves all global mixins stored in the storage.
     * @returns An array of global mixins.
     */
    static getGlobalMixins(): GlobalMixin[] {
        return this.globalMixins;
    }
}

/**
 * Central registry for applying mixins to methods.
 */
export class MixinRegistry {
    private static headApplier = new HeadMixinApplier();
    private static tailApplier = new TailMixinApplier();
    private static insertApplier = new InsertMixinApplier();
    private static globalApplier = new GlobalMixinApplier();

    /**
     * Registers a mixin to be applied to a method.
     * @param mixin The mixin to be registered.
     */
    static registerMixin(mixin: Mixin): void {
        if (mixin.at === "HEAD") {
            this.headApplier.apply(mixin);
        } else if (mixin.at === "TAIL") {
            this.tailApplier.apply(mixin);
        } else if (typeof mixin.at === "object" && mixin.at.name === "INSERT") {
            this.insertApplier.apply(mixin);
        } else {
            throw new Error("Invalid mixin location.");
        }
    }

    /**
     * Registers a global mixin to be applied across all of the code.
     * @param mixin The global mixin to be registered.
     * @param globalFn The name of the global function where the mixin is applied.
     */
    static registerGlobalMixin(mixin: GlobalMixin, globalFn: string): void {
        this.globalApplier.apply(mixin, globalFn);
    }
}
