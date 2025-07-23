import { CallbackInfo } from "./types";
/**
 * Utility class for generating callback content.
 */
export declare class CallbackGenerator {
    /**
     * Generates the content of a mixin callback function.
     * @param callback The callback function to be executed as a mixin.
     * @param ctxParam The name of the context parameter in the callback.
     * @param infoParam The name of the info parameter in the callback.
     * @param info The info about the environment where the mixin is applied.
     * @returns The generated callback content.
     */
    static generateCallbackContent(callback: Function, ctxParam: string, infoParam: string, info: CallbackInfo): string;
    /**
     * Generates content for a global mixin callback.
     * @param callback The callback function.
     * @param ctxParam The name of the context parameter.
     * @returns The generated content.
     */
    static generateGlobalCallbackContent(callback: Function, ctxParam: string): string;
}
