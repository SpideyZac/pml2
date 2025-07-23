import { Mixin, GlobalMixin } from "./types";
/**
 * Central registry for applying mixins to methods.
 */
export declare class MixinRegistry {
    private static headApplier;
    private static tailApplier;
    private static insertApplier;
    private static globalApplier;
    /**
     * Registers a mixin to be applied to a method.
     * @param mixin The mixin to be registered.
     */
    static registerMixin(mixin: Mixin): void;
    /**
     * Registers a global mixin to be applied across all of the code.
     * @param mixin The global mixin to be registered.
     * @param globalFn The name of the global function where the mixin is applied.
     */
    static registerGlobalMixin(mixin: GlobalMixin, globalFn: string): void;
}
