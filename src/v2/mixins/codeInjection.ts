import { escapeRegExp } from "./utils";
import { CallbackInfo } from "./types";

/**
 * Utility functions for parsing function metadata.
 */
export namespace FunctionParser {
    /**
     * Parses the parameters of a function and returns them as an array of strings.
     * @param fn The function to parse.
     * @returns An array of parameter names.
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    export function parseParams(fn: Function): string[] {
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
    export function parseBody(fn: Function): string {
        const code = fn.toString();
        return code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
    }
}

/**
 * Utility class for code injection operations.
 */
export namespace CodeInjector {
    /**
     * Finds all indices where a target token appears in the code.
     * @param code The code to search in.
     * @param target The target token to find.
     * @returns An array of indices where the target token ends.
     */
    export function findTargetIndices(code: string, target: string): number[] {
        const targetRegex = new RegExp(`${escapeRegExp(target)}`, "g");
        const targetIndices: number[] = [];
        let match;
        while ((match = targetRegex.exec(code)) !== null) {
            targetIndices.push(match.index + match[0].length);
        }
        return targetIndices;
    }

    /**
     * Injects content at specific indices in the code.
     * @param code The original code.
     * @param content The content to inject.
     * @param targetIndices The indices where to inject the content.
     * @param ordinal If specified, only inject at the nth occurrence.
     * @returns The modified code.
     */
    export function injectAtIndices(
        code: string,
        content: string,
        targetIndices: number[],
        ordinal?: number
    ): string {
        if (ordinal !== undefined) {
            if (ordinal < 0) {
                throw new Error("Ordinal must be a non-negative integer.");
            }

            const targetIndex = targetIndices[ordinal];
            if (targetIndex !== undefined) {
                return (
                    code.slice(0, targetIndex) +
                    content +
                    code.slice(targetIndex)
                );
            }
            return code;
        } else {
            // Inject after every occurrence, accounting for offset
            let offset = 0;
            let modifiedCode = code;
            for (const index of targetIndices) {
                modifiedCode =
                    modifiedCode.slice(0, index + offset) +
                    content +
                    modifiedCode.slice(index + offset);
                offset += content.length;
            }
            return modifiedCode;
        }
    }

    /**
     * Finds the last return statement in the main scope of a method.
     * @param code The method body code.
     * @returns The index of the last return statement, or -1 if not found in main scope.
     */
    export function findLastMainScopeReturn(code: string): number {
        let lastReturnIndex = code.lastIndexOf("return");
        if (lastReturnIndex !== -1) {
            // If the number of closing braces after the last return statement is greater than 0,
            // it means that the return statement is not in the main scope of the method.
            const closingBracesCount = (
                code.slice(lastReturnIndex).match(/}/g) || []
            ).length;
            if (closingBracesCount !== 0) {
                lastReturnIndex = -1;
            }
        }
        return lastReturnIndex;
    }
}


/**
 * Utility class for generating callback content.
 */
export namespace CallbackGenerator {
    /**
     * Generates the content of a mixin callback function.
     * @param callback The callback function to be executed as a mixin.
     * @param ctxParam The name of the context parameter in the callback.
     * @param infoParam The name of the info parameter in the callback.
     * @param info The info about the environment where the mixin is applied.
     * @returns The generated callback content.
     */
    export function generateCallbackContent(
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
        content += FunctionParser.parseBody(callback).replace(ctxRegex, "this");

        if (info.cancellable) {
            content += `if (${infoParam}.cancelled) return ${infoParam}.returnValue;`;
        }

        return content;
    }

    /**
     * Generates content for a global mixin callback.
     * @param callback The callback function.
     * @param ctxParam The name of the context parameter.
     * @returns The generated content.
     */
    export function generateGlobalCallbackContent(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        callback: Function,
        ctxParam: string
    ): string {
        return FunctionParser.parseBody(callback).replace(
            new RegExp(`\\b${escapeRegExp(ctxParam)}\\b`, "g"),
            "this"
        );
    }
}
