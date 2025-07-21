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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returnValue?: any;
    /**
     * Cancels the mixin execution.
     */
    cancel?(): void;
    /**
     * Cancels the mixin execution and returns a value.
     * @param value The value to return.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: conditions?
    // /**
    //  * If the mixin is applied only if the conditions are met.
    //  * If a condition is met, it should call `info.cancel()` to cancel the mixin execution.
    //  * Defaults to an empty array.
    //  */
    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // conditions?: Array<(info: CallbackInfo, ...locales: any[]) => void>;
    /**
     * The callback function to be executed when the mixin is applied.
     * @param this_ The context of the method where the mixin is applied. The name of the parameter cannot clash with any locales in the target method.
     * @param info The info about the environment where the mixin is applied.
     * @param locales The locales in the method used by the mixin.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback(this_: any, info: CallbackInfo, ...locales: any[]): void;
}

/**
 * Applies a mixin to the head of a method.
 * @param mixin The mixin to be applied.
 */
function applyHeadMixin(mixin: Mixin): void {
    if (mixin.at !== "HEAD")
        throw new Error("Mixin must be applied at the head of the method.");

    const code = eval(mixin.method).toString();
    const params = code.slice(code.indexOf("(") + 1, code.indexOf(")"));
    const footer = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));

    const info: CallbackInfo = {
        name: mixin.method,
        cancellable: mixin.cancellable ?? false,
        cancelled: false,
    };

    let content = `var info = ${JSON.stringify(info)};`;

    if (mixin.cancellable) {
        content += `info.cancel = () => { info.cancelled = true; };`;
        content += `info.cancelWithValue = (value) => { info.cancelled = true; info.returnValue = value; };`;
    }

    const callback = mixin.callback.toString();
    const callbackParams = callback
        .slice(callback.indexOf("(") + 1, callback.indexOf(")"))
        .split(",")
        .map((param) => param.trim());

    const thisParam = callbackParams[0];

    content += callback
        .slice(
            mixin.callback.toString().indexOf("{") + 1,
            mixin.callback.toString().lastIndexOf("}")
        )
        .replace(thisParam, "this");

    if (mixin.cancellable) {
        content += `if (info.cancelled) return info.returnValue;`;
    }

    eval(`${mixin.method} = function(${params}){${content}${footer}}`);
}

export { applyHeadMixin, CallbackInfo, Mixin };
