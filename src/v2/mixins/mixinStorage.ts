/* eslint-disable @typescript-eslint/no-namespace */
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
    private mixins: Mixin[] = [];
    private globalMixins: GlobalMixin[] = [];

    /**
     * Adds a mixin to the storage.
     * @param mixin The mixin to add.
     */
    addMixin(mixin: Mixin): void {
        this.mixins.push(mixin);
    }

    /**
     * Retrieves all mixins stored in the storage.
     * @returns An array of mixins.
     */
    getMixins(): Mixin[] {
        return this.mixins;
    }

    /**
     * Adds a global mixin to the storage.
     * @param mixin The global mixin to add.
     */
    addGlobalMixin(mixin: GlobalMixin): void {
        this.globalMixins.push(mixin);
    }

    /**
     * Retrieves all global mixins stored in the storage.
     * @returns An array of global mixins.
     */
    getGlobalMixins(): GlobalMixin[] {
        return this.globalMixins;
    }
}

/**
 * Central registry for applying mixins to methods.
 */
export namespace MixinRegistry {
    const headApplier = new HeadMixinApplier();
    const tailApplier = new TailMixinApplier();
    const insertApplier = new InsertMixinApplier();
    const globalApplier = new GlobalMixinApplier();

    /**
     * Registers a mixin to be applied to a method.
     * @param mixin The mixin to be registered.
     */
    export function registerMixin(mixin: Mixin): void {
        if (mixin.at === "HEAD") {
            headApplier.apply(mixin);
        } else if (mixin.at === "TAIL") {
            tailApplier.apply(mixin);
        } else if (typeof mixin.at === "object" && mixin.at.name === "INSERT") {
            insertApplier.apply(mixin);
        } else {
            throw new Error("Invalid mixin location.");
        }
    }

    /**
     * Registers a global mixin to be applied across all of the code.
     * @param mixin The global mixin to be registered.
     * @param globalFn The name of the global function where the mixin is applied.
     */
    export function registerGlobalMixin(
        mixin: GlobalMixin,
        globalFn: string
    ): void {
        globalApplier.apply(mixin, globalFn);
    }
}
