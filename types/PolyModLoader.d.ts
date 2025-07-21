/**
 * An interface which represents an info about the environment where the mixin is applied.
 */
interface CallbackInfo {
    /**
     * The name of the method where the mixin is applied.
     */
    name: string;
    /**
     * If the mixin is cancellable.
     */
    cancellable: boolean;
    /**
     * If the mixin is cancelled.
     */
    cancelled: boolean;
    /**
     * The return value of the mixin.
     */
    returnValue?: any;
    /**
     * Cancels the mixin execution.
     */
    cancel?(): void;
    /**
     * Cancels the mixin execution and returns a value.
     * @param value The value to return.
     */
    cancelWithValue?(value: any): void;
}
/**
 * An interface which represents a mixin that can be applied to a method.
 */
interface Mixin {
    /**
     * The name of the method where the mixin is applied.
     */
    method: string;
    /**
     * The location where the mixin is applied.
     */
    at: "HEAD";
    /**
     * If the mixin is cancellable.
     * Defaults to false.
     */
    cancellable?: boolean;
    /**
     * The callback function to be executed when the mixin is applied.
     * @param this_ The context of the method where the mixin is applied. The name of the parameter cannot clash with any locales in the target method.
     * @param info The info about the environment where the mixin is applied.
     * @param locales The locales in the method used by the mixin.
     */
    callback(this_: any, info: CallbackInfo, ...locales: any[]): void;
}
/**
 * Applies a mixin to the head of a method.
 * @param mixin The mixin to be applied.
 */
declare function applyHeadMixin(mixin: Mixin): void;
export { applyHeadMixin, Mixin, CallbackInfo };
