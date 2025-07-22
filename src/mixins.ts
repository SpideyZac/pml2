/**
 * A type which represents info about the environment where the mixin is applied.
 */
type CallbackInfo = {
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
    cancel?: () => void;
    /**
     * Cancels the mixin execution and returns a value.
     * @param value The value to return.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cancelWithValue?: (value: any) => void;
};

/**
 * A type which represents a mixin that can be applied to a method.
 */
type Mixin = {
    /**
     * Whether the mixin is applied before or after PolyTrack initialization.
     */
    preInit: boolean;
    /**
     * The name of the method where the mixin is applied.
     */
    method: string;
    /**
     * The location where the mixin is applied.
     *
     * * `HEAD` - The mixin is applied at the start of the method.
     * * `TAIL` - The mixin is applied at the end of the method (before the final return call in the main scope of the method, if any).
     */
    at: "HEAD" | "TAIL";
    /**
     * If the mixin is cancellable.
     * Defaults to false.
     */
    cancellable?: boolean;
    /**
     * The code to be executed as the mixin.
     *
     * @param ctx The context of the mixin. This is equivalent to `this` in the method. Make sure the name of this parameter does not conflict with any locales in the target method.
     * @param info The info about the environment where the mixin is applied. Make sure the name of this parameter does not conflict with any locales in the target method.
     * @param locales The locales of the target method which are accessed by the mixin.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback(ctx: any, info: CallbackInfo, ...locales: any[]): void;
};

/**
 * Parses the parameters of a function and returns them as an array of strings.
 * @param fn The function to parse.
 * @returns An array of parameter names.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function parseFunctionParams(fn: Function): string[] {
    const code = fn.toString();
    const params = code.slice(code.indexOf("(") + 1, code.indexOf(")"));
    return params.split(",").map((param) => param.trim());
}

/**
 * Parses the body of a function and returns it as a string.
 * @param fn The function to parse.
 * @returns The body of the function as a string.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function parseFunctionBody(fn: Function): string {
    const code = fn.toString();
    return code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
}

/**
 * Generates the content of a mixin callback function.
 * @param callback The callback function to be executed as a mixin.
 * @param ctxParam The name of the context parameter in the callback.
 * @param infoParam The name of the info parameter in the callback.
 * @param info The info about the environment where the mixin is applied.
 * @returns The generated callback content.
 */
function generateCallbackContent(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
    ctxParam: string,
    infoParam: string,
    info: CallbackInfo
): string {
    let content = `var ${infoParam} = ${JSON.stringify(info)};`;

    if (info.cancellable) {
        content += `${infoParam}.cancel = () => { ${infoParam}.cancelled = true; };`;
        content += `${infoParam}.cancelWithValue = (value) => { ${infoParam}.cancelled = true; ${infoParam}.returnValue = value; };`;
    }

    const ctxRegex = new RegExp(`\\b${ctxParam}\\b`, "g");
    content += parseFunctionBody(callback).replace(ctxRegex, "this");

    if (info.cancellable) {
        content += `if (${infoParam}.cancelled) return ${infoParam}.returnValue;`;
    }

    return content;
}

/**
 * Applies a mixin to the head of a method.
 * @param mixin The mixin to be applied.
 */
function applyHeadMixin(mixin: Mixin): void {
    if (mixin.at !== "HEAD")
        throw new Error("Mixin must be applied at the head of the method.");

    const func = eval(mixin.method);
    const params = parseFunctionParams(func);
    const footer = parseFunctionBody(func);

    let [ctxParam, infoParam] = parseFunctionParams(mixin.callback);
    ctxParam = ctxParam || "ctx";
    infoParam = infoParam || "info";

    const info: CallbackInfo = {
        name: mixin.method,
        cancellable: mixin.cancellable ?? false,
        cancelled: false,
    };

    const content = generateCallbackContent(
        mixin.callback,
        ctxParam,
        infoParam,
        info
    );
    eval(
        `${mixin.method} = function(${params.join(",")}){${content}${footer}}`
    );
}

/**
 * Applies a mixin to the tail of a method.
 * @param mixin The mixin to be registered.
 */
function applyTailMixin(mixin: Mixin): void {
    if (mixin.at !== "TAIL")
        throw new Error("Mixin must be applied at the tail of the method.");

    const func = eval(mixin.method);
    const params = parseFunctionParams(func);
    let code = parseFunctionBody(func);

    let [ctxParam, infoParam] = parseFunctionParams(mixin.callback);
    ctxParam = ctxParam || "ctx";
    infoParam = infoParam || "info";

    const info: CallbackInfo = {
        name: mixin.method,
        cancellable: mixin.cancellable ?? false,
        cancelled: false,
    };

    const content = generateCallbackContent(
        mixin.callback,
        ctxParam,
        infoParam,
        info
    );

    let lastReturnIndex = code.lastIndexOf("return");
    if (lastReturnIndex !== -1) {
        // If the number of closing braces after the last return statement is greater than 0 (because the main scope's braces are removed from code),
        // it means that the return statement is not in the main scope of the method.
        const closingBracesCount = (
            code.slice(lastReturnIndex).match(/}/g) || []
        ).length;
        if (closingBracesCount !== 0) {
            lastReturnIndex = -1;
        }
    }

    if (lastReturnIndex === -1) {
        // If no valid return statement was found, we can safely append the mixin content to the end of the method.
        code += content;
    } else {
        // If a valid return statement was found, we need to insert the mixin content before it.
        code =
            code.slice(0, lastReturnIndex) +
            content +
            code.slice(lastReturnIndex);
    }

    eval(`${mixin.method} = function(${params.join(",")}){${code}}`);
}

/**
 * Registers a mixin to be applied to a method.
 * @param mixin The mixin to be registered.
 */
function registerMixin(mixin: Mixin): void {
    if (mixin.at === "HEAD") {
        applyHeadMixin(mixin);
    } else if (mixin.at === "TAIL") {
        applyTailMixin(mixin);
    } else {
        throw new Error("Invalid mixin location.");
    }
}

export { Mixin, CallbackInfo, registerMixin };
