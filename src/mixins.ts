import { escapeRegExp } from "./utils";

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
     * * `RETURN` - The mixin is applied before every return statement in the method. If `ordinal` is specified, the mixin is applied before the nth return statement in the method.
     * `ordinal` is 0-indexed, meaning that the first return statement is at index 0. If the return statement at the specified index does not exist, the mixin will not be applied.
     * * `INVOKE` - The mixin is applied before the invocation of a method. If the `target` property is specified, the mixin will be applied before the invocation of a method with a specific name.
     * If the `target` property is not specified, the mixin will be applied before any method invocation.
     * If the `ordinal` property is specified, the mixin will be applied before the nth invocation of the method.
     * If the `ordinal` property is not specified, the mixin will be applied before every invocation of the method.
     * * `NEW` - The mixin is applied before the instantiation of a class. If the `target` property is specified, the mixin will be applied before the instantiation of a class with a specific name.
     * If the `target` property is not specified, the mixin will be applied before any class instantiation.
     * If the `ordinal` property is specified, the mixin will be applied before the nth instantiation of the class.
     * If the `ordinal` property is not specified, the mixin will be applied before every instantiation of the class.
     */
    at:
        | "HEAD"
        | "TAIL"
        | { name: "RETURN"; ordinal?: number }
        | { name: "INVOKE"; target?: string; ordinal?: number }
        | { name: "NEW"; target?: string; ordinal?: number };
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

    const ctxRegex = new RegExp(`\\b${escapeRegExp(ctxParam)}\\b`, "g");
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
 * Applies a mixin to the return statements of a method.
 * @param mixin The mixin to be applied.
 */
function applyReturnMixin(mixin: Mixin): void {
    if (typeof mixin.at !== "object" || mixin.at.name !== "RETURN")
        throw new Error(
            "Mixin must be applied at the return statements of the method."
        );

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

    // Find all return statements and insert the mixin content before each one. If `ordinal` is specified, only the nth return statement will be modified.
    const returnRegex = new RegExp("\\breturn\\b", "g");
    const returnIndices: number[] = [];
    let match;
    while ((match = returnRegex.exec(code)) !== null) {
        returnIndices.push(match.index);
    }

    if (mixin.at.ordinal != undefined) {
        if (mixin.at.ordinal < 0) {
            throw new Error("Ordinal must be a non-negative integer.");
        }

        const targetIndex = returnIndices[mixin.at.ordinal];
        if (targetIndex !== undefined) {
            code =
                code.slice(0, targetIndex) + content + code.slice(targetIndex);
        }
    } else {
        // Apply the mixin to all return statements. We need to add the length of the content to the following return statements' indices.
        let offset = 0;
        for (const index of returnIndices) {
            code =
                code.slice(0, index + offset) +
                content +
                code.slice(index + offset);
            offset += content.length;
        }
    }

    eval(`${mixin.method} = function(${params.join(",")}){${code}}`);
}

/**
 * Applies a mixin to the invocation of a method.
 * @param mixin The mixin to be applied.
 */
function applyInvokeMixin(mixin: Mixin): void {
    if (typeof mixin.at !== "object" || mixin.at.name !== "INVOKE") {
        throw new Error(
            "Mixin must be applied at the invocation of the method."
        );
    }

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

    // Get all method invocations in the code.
    let invocations;
    if (mixin.at.target) {
        // find target(params) invocations and return their indices
        const targetRegex = new RegExp(
            `(?<!\\bnew\\s+)\\b${escapeRegExp(mixin.at.target)}\\s*\\(`,
            "g"
        );
        invocations = [];
        let match;
        while ((match = targetRegex.exec(code)) !== null) {
            invocations.push(match.index);
        }
    } else {
        // find all method invocations and return their indices
        const targetRegex = new RegExp(
            `(?<!\\bnew\\s+)\\b[a-zA-Z_$][a-zA-Z0-9_$]*(\\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\\s*\\(`,
            "g"
        );
        invocations = [];
        let match;
        while ((match = targetRegex.exec(code)) !== null) {
            invocations.push(match.index);
        }
    }

    // We need to map the indicies to the start of the line/last semicolon to prevent errors
    invocations = invocations.map((index) => {
        // Find the last semicolon or the start of the line before the invocation
        const beforeInvocation = code.slice(0, index);
        const lastSemicolonIndex = beforeInvocation.lastIndexOf(";");
        const lastLineBreakIndex = beforeInvocation.lastIndexOf("\n");
        const startIndex = Math.max(lastSemicolonIndex, lastLineBreakIndex);
        return startIndex === -1 ? index : startIndex + 1; // +1 to include the character after the semicolon or line break
    });

    // If `ordinal` is specified, only the nth invocation will be modified.
    if (mixin.at.ordinal != undefined) {
        if (mixin.at.ordinal < 0) {
            throw new Error("Ordinal must be a non-negative integer.");
        }

        const targetIndex = invocations[mixin.at.ordinal];
        if (targetIndex !== undefined) {
            code =
                code.slice(0, targetIndex) + content + code.slice(targetIndex);
        }
    } else {
        // Apply the mixin to all invocations. We need to add the length of the content to the following invocations' indices.
        let offset = 0;
        for (const index of invocations) {
            code =
                code.slice(0, index + offset) +
                content +
                code.slice(index + offset);
            offset += content.length;
        }
    }

    eval(`${mixin.method} = function(${params.join(",")}){${code}}`);
}

/**
 * Applies a mixin to the creation of a new instance of a class.
 * @param mixin The mixin to be applied.
 */
function applyNewMixin(mixin: Mixin): void {
    if (typeof mixin.at !== "object" || mixin.at.name !== "NEW") {
        throw new Error(
            "Mixin must be applied at the instantiation of a class."
        );
    }

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

    // Get all class instantiations in the code.
    let instantiations;
    if (mixin.at.target) {
        // find target(params) instantiations and return their indices
        const targetRegex = new RegExp(
            `\\bnew\\s+${escapeRegExp(mixin.at.target)}\\s*\\(`,
            "g"
        );
        instantiations = [];
        let match;
        while ((match = targetRegex.exec(code)) !== null) {
            instantiations.push(match.index);
        }
    } else {
        // find all class instantiations and return their indices
        const targetRegex = new RegExp(
            `\\bnew\\s+[a-zA-Z_$][a-zA-Z0-9_$]*(\\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\\s*\\(`,
            "g"
        );
        instantiations = [];
        let match;
        while ((match = targetRegex.exec(code)) !== null) {
            instantiations.push(match.index);
        }
    }

    // We need to map the indicies to the start of the line/last semicolon to prevent errors
    instantiations = instantiations.map((index) => {
        // Find the last semicolon or the start of the line before the instantiation
        const beforeInstantiation = code.slice(0, index);
        const lastSemicolonIndex = beforeInstantiation.lastIndexOf(";");
        const lastLineBreakIndex = beforeInstantiation.lastIndexOf("\n");
        const startIndex = Math.max(lastSemicolonIndex, lastLineBreakIndex);
        return startIndex === -1 ? index : startIndex + 1; // +1 to include the character after the semicolon or line break
    });

    // If `ordinal` is specified, only the nth instantiation will be modified.
    if (mixin.at.ordinal != undefined) {
        if (mixin.at.ordinal < 0) {
            throw new Error("Ordinal must be a non-negative integer.");
        }

        const targetIndex = instantiations[mixin.at.ordinal];
        if (targetIndex !== undefined) {
            code =
                code.slice(0, targetIndex) + content + code.slice(targetIndex);
        }
    } else {
        // Apply the mixin to all instantiations. We need to add the length of the content to the following instantiations' indices.
        let offset = 0;
        for (const index of instantiations) {
            code =
                code.slice(0, index + offset) +
                content +
                code.slice(index + offset);
            offset += content.length;
        }
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
    } else if (typeof mixin.at === "object" && mixin.at.name === "RETURN") {
        applyReturnMixin(mixin);
    } else if (typeof mixin.at === "object" && mixin.at.name === "INVOKE") {
        applyInvokeMixin(mixin);
    } else if (typeof mixin.at === "object" && mixin.at.name === "NEW") {
        applyNewMixin(mixin);
    } else {
        throw new Error("Invalid mixin location.");
    }
}

export { Mixin, CallbackInfo, registerMixin };
