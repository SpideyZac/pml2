import { GlobalMixin } from "./types";
/**
 * Applies global mixins across all code.
 */
export declare class GlobalMixinApplier {
    /**
     * Applies a global mixin to a function.
     * @param mixin The global mixin to apply.
     * @param globalFn The name of the global function.
     */
    apply(mixin: GlobalMixin, globalFn: string): void;
    private generateGlobalMixinContent;
}
