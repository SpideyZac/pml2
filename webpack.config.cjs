const path = require("path");

module.exports = (env, argv) => {
    const isProd = argv.mode === "production";
    return {
        mode: isProd ? "production" : "development",
        entry: "./src/index.ts",
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.js$/,
                    enforce: "pre",
                    use: ["source-map-loader"],
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        output: {
            filename: "PolyModLoader.bundle.js",
            path: path.resolve(
                __dirname,
                isProd ? "dist/pml/release" : "dist/pml/debug"
            ),
            library: "PolyModLoader",
        },
        node: {
            global: false,
        },
    };
};
