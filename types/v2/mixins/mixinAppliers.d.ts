import { Mixin } from "./types";
/**
 * Base class for mixin appliers with common functionality.
 */
declare abstract class BaseMixinApplier {
    protected generateMixinContent(mixin: Mixin): string;
    protected reconstructFunction(method: string, params: string[], body: string): void;
}
/**
 * Applies mixins to the head of methods.
 */
export declare class HeadMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void;
}
/**
 * Applies mixins to the tail of methods.
 */
export declare class TailMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void;
}
/**
 * Applies mixins at specific insertion points in methods.
 */
export declare class InsertMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void;
}
export {};
