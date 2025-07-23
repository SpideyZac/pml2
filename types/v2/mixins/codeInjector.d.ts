/**
 * Utility class for code injection operations.
 */
export declare class CodeInjector {
    /**
     * Finds all indices where a target token appears in the code.
     * @param code The code to search in.
     * @param target The target token to find.
     * @returns An array of indices where the target token ends.
     */
    static findTargetIndices(code: string, target: string): number[];
    /**
     * Injects content at specific indices in the code.
     * @param code The original code.
     * @param content The content to inject.
     * @param targetIndices The indices where to inject the content.
     * @param ordinal If specified, only inject at the nth occurrence.
     * @returns The modified code.
     */
    static injectAtIndices(code: string, content: string, targetIndices: number[], ordinal?: number): string;
    /**
     * Finds the last return statement in the main scope of a method.
     * @param code The method body code.
     * @returns The index of the last return statement, or -1 if not found in main scope.
     */
    static findLastMainScopeReturn(code: string): number;
}
