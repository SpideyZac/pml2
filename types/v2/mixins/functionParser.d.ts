/**
 * Utility functions for parsing function metadata.
 */
export declare class FunctionParser {
    /**
     * Parses the parameters of a function and returns them as an array of strings.
     * @param fn The function to parse.
     * @returns An array of parameter names.
     */
    static parseParams(fn: Function): string[];
    /**
     * Parses the body of a function and returns it as a string.
     * @param fn The function to parse.
     * @returns The body of the function as a string.
     */
    static parseBody(fn: Function): string;
}
