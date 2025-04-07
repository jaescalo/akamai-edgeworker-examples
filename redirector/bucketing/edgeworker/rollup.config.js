import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy-assets";
export default {
  input: "src/main.js",
  external: ["log", "./edgekv.js"],
  output: {
    format: "es",
    dir: "dist/work",

    // Use entryFileNames for the main chunk and chunkFileNames for the other chunks
    chunkFileNames: (chunkInfo) => {
      if (chunkInfo.name === "vendor") {
        return "murmurhash.js";
      }
      return "[name]-[hash].js";
    },

    manualChunks: {
      vendor: [
        "murmurhash3js",
      ] /* This option allowed to create a separate file for the fxp module */,
    },
  },
  plugins: [
    //Converts CommonJS modules to ES6 modules.
    commonjs(),
    //Helps Rollup resolve modules from the node_modules directory.
    resolve(),
    //Copies bundle.json to the output directory
    copy({
      assets: ["./bundle.json", "./edgekv_tokens.js", "./edgekv.js"],
    }),
  ],
};
