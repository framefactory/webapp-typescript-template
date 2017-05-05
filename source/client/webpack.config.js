var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        "main": path.resolve(__dirname, "bundles/main.tsx")
    },
    output: {
        path: path.resolve(__dirname, "../../services/server/static/app"),
        filename: "[name].js"
    },

    // Enable source maps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

            // All SCSS files will be converted to CSS and concatenated.
            //{ test: /\.scss$/, loaders: ['style', 'css', 'sass'] }
            { test: /\.scss$/, loader: ExtractTextPlugin.extract('css-loader!sass-loader') }
        ]
    },

    plugins: [
        new ExtractTextPlugin({
            filename: "styles.css",
            allChunks: true
        })
    ],

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },

    /*
     watch: true,
     watchOptions: {
     poll: 3
     }
     */
};