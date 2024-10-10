import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy-assets';

export default {
  /* Specify main file for EdgeWorker */
  input: 'src/main.ts',

  /* Define external modules, which will be provided by the EdgeWorker platform */
  external: ['url-search-params', 'log', 'http-request', 'encoding'],

  /* Define output format as an ES module and specify the output directory */
  output: {
    format: 'es',
    dir: "dist/work",
    manualChunks: {
      'vendor': ['@launchdarkly/akamai-server-base-sdk'] /* This option allowed to create a separate file for the fxp module */
    }
  },

  /* Bundle all modules into a single output module */
  preserveModules: false,
  plugins: [
    /* Convert to Typescript */
    typescript(),

    /* Resolve modules from node_modules */
    resolve(),

    /* Convert commonJS modules */
    commonjs(),

    /* Copy bundle.json to the output directory */
    copy({
      assets: ['bundle.json'],
    }),
  ],
};
