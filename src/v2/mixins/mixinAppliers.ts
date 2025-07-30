import { Mixin, GlobalMixin, CallbackInfo } from "./types";
import { FunctionParser, CodeInjector, CallbackGenerator } from "./codeInjection";

/**
 * Base class for mixin appliers with common functionality.
 */
abstract class BaseMixinApplier {
    /**
     * Applies a mixin to a method.
     * @param mixin The mixin to apply.
     */
    public abstract apply(mixin: Mixin): void;

    /**
     * Generates the content for a mixin.
     * @param mixin The mixin to generate content for.
     * @throws Error if neither code nor callback is provided.
     * @returns The generated content.
     */
    protected generateMixinContent(mixin: Mixin): string {
        if (mixin.code !== undefined) {
            return mixin.code;
        }

        if (!mixin.callback) {
            throw new Error(
                "Either code or callback must be provided for mixin."
            );
        }

        const params = FunctionParser.parseParams(mixin.callback);
        const ctxParam = params[0] || "ctx";
        const infoParam = params[1] || "info";

        const info: CallbackInfo = {
            name: mixin.method,
            cancellable: mixin.cancellable ?? false,
            cancelled: false,
        };

        return CallbackGenerator.generateCallbackContent(
            mixin.callback,
            ctxParam,
            infoParam,
            info
        );
    }

    /**
     * Reconstructs a function with the given method name, parameters, and body.
     * @param method The name of the method to reconstruct.
     * @param params The parameters of the method.
     * @param body The body of the method.
     */
    protected reconstructFunction(
        method: string,
        params: string[],
        body: string
    ): void {
        eval(`${method} = function(${params.join(",")}){${body}}`);
    }
}

/**
 * Applies mixins to the head of methods.
 */
export class HeadMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void {
        if (mixin.at !== "HEAD") {
            throw new Error("Mixin must be applied at the head of the method.");
        }

        const func = eval(mixin.method);
        const params = FunctionParser.parseParams(func);
        const footer = FunctionParser.parseBody(func);
        const content = this.generateMixinContent(mixin);

        this.reconstructFunction(mixin.method, params, content + footer);
    }
}

/**
 * Applies mixins to the tail of methods.
 */
export class TailMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void {
        if (mixin.at !== "TAIL") {
            throw new Error("Mixin must be applied at the tail of the method.");
        }

        const func = eval(mixin.method);
        const params = FunctionParser.parseParams(func);
        let code = FunctionParser.parseBody(func);
        const content = this.generateMixinContent(mixin);

        const lastReturnIndex = CodeInjector.findLastMainScopeReturn(code);

        if (lastReturnIndex === -1) {
            // No valid return statement found, append to end
            code += content;
        } else {
            // Insert before the return statement
            code =
                code.slice(0, lastReturnIndex) +
                content +
                code.slice(lastReturnIndex);
        }

        this.reconstructFunction(mixin.method, params, code);
    }
}

/**
 * Applies mixins at specific insertion points in methods.
 */
export class InsertMixinApplier extends BaseMixinApplier {
    apply(mixin: Mixin): void {
        if (typeof mixin.at !== "object" || mixin.at.name !== "INSERT") {
            throw new Error(
                "Mixin must be applied at a specific location in the method."
            );
        }

        const func = eval(mixin.method);
        const params = FunctionParser.parseParams(func);
        let code = FunctionParser.parseBody(func);
        const content = this.generateMixinContent(mixin);

        const targetIndices = CodeInjector.findTargetIndices(
            code,
            mixin.at.target
        );
        code = CodeInjector.injectAtIndices(
            code,
            content,
            targetIndices,
            mixin.at.ordinal
        );

        this.reconstructFunction(mixin.method, params, code);
    }
}

/**
 * Applies global mixins across all code.
 */
export class GlobalMixinApplier {
    /**
     * Applies a global mixin to a function.
     * @param mixin The global mixin to apply.
     * @param globalFn The name of the global function.
     */
    apply(mixin: GlobalMixin, globalFn: string): void {
        const func = eval(globalFn);
        const params = FunctionParser.parseParams(func);
        let code = FunctionParser.parseBody(func);

        const content = this.generateGlobalMixinContent(mixin);
        const targetIndices = CodeInjector.findTargetIndices(
            code,
            mixin.target
        );
        code = CodeInjector.injectAtIndices(
            code,
            content,
            targetIndices,
            mixin.ordinal
        );

        eval(`${globalFn} = function(${params.join(",")}){${code}}`);
    }

    private generateGlobalMixinContent(mixin: GlobalMixin): string {
        if (mixin.code !== undefined) {
            return mixin.code;
        }

        if (!mixin.callback) {
            throw new Error(
                "Either code or callback must be provided for global mixin."
            );
        }

        const params = FunctionParser.parseParams(mixin.callback);
        const ctxParam = params[0] || "ctx";

        return CallbackGenerator.generateGlobalCallbackContent(
            mixin.callback,
            ctxParam
        );
    }
}
