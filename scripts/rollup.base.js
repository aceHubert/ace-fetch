import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
// import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import externalGlobals from 'rollup-plugin-external-globals';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import dts from 'rollup-plugin-dts';
import lisence from 'rollup-plugin-license';
import { DEFAULT_EXTENSIONS } from '@babel/core';

const extensions = [...DEFAULT_EXTENSIONS, '.ts', '.tsx'];

const presets = (filename, targetName, externals) => {
  const _externals = {
    vue: 'Vue',
    'vue-demi': 'VueDemi',
    '@vue/composition-api': 'VueCompositionAPI',
    '@ace-fetch/core': 'AceFetch.Core',
    '@ace-fetch/axios': 'AceFetch.Axios',
    '@ace-fetch/cross-fetch': 'AceFetch.CrossFetch',
    '@ace-fetch/vue': 'AceFetch.Vue',
    ...externals,
  };
  return [
    resolve({
      browser: true,
      // Set the root directory to be the parent folder
      rootDir: path.join(__dirname, '..'),
      extensions,
      // modulesOnly: true,
    }),
    // 使用 @babel/preset-typescript 编译 ts
    // typescript({
    //   tsconfig: './tsconfig.build.json',
    //   tsconfigOverride: {
    //     compilerOptions: {
    //       module: 'ESNext',
    //       declaration: false,
    //     },
    //   },
    // }),
    commonjs(),
    babel({
      // https://babeljs.io/docs/en/options#rootMode
      rootMode: 'upward', // 向上级查找 babel.config.js
      exclude: [/\/@babel\//, /\/core-js\//],
      babelHelpers: 'bundled',
      extensions,
    }),
    json(),
    externalGlobals(_externals, {
      exclude: ['**/*.{less,sass,scss}'],
    }),
  ];
};

const createEnvPlugin = (env) => {
  return injectProcessEnv(
    {
      NODE_ENV: env,
    },
    {
      exclude: '**/*.{css,less,sass,scss}',
      verbose: false,
    },
  );
};

const createLisencePlugin = () => {
  // 从执行目录 package.json 中获取
  const packageConfig = require(path.resolve(process.cwd(), 'package.json'));
  return lisence({
    banner: {
      commentStyle: 'regular', // The default
      content: `${packageConfig.name}@${packageConfig.version}`,
    },
  });
};

const inputFilePath = path.join(process.cwd(), 'src/index.ts');

const noUIDtsPackages = ['utils'];

export const removeImportStyleFromInputFilePlugin = () => ({
  name: 'remove-import-style-from-input-file',
  transform(code, id) {
    // 样式由 build:style 进行打包，所以要删除入口文件上的 `import './style'`
    if (inputFilePath === id) {
      return code.replace(`import './style';`, '');
    }

    return code;
  },
});

/**
 * base rollup config
 */
export default (filename, targetName, externals = {}, sourcemap = true) => {
  function onwarn(warning, warn) {
    // ignoer 'this' rewrite with 'undefined' warn
    if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'SOURCEMAP_ERROR') return;
    warn(warning); // this requires Rollup 0.46
  }

  const base = [
    {
      input: 'src/index.ts',
      output: {
        format: 'umd',
        file: `dist/${filename}.umd.development.js`,
        name: targetName,
        sourcemap,
        exports: 'named',
        amd: {
          id: filename,
        },
        intro: `(function(){
          var global = this || self;
          global.globalThis = global;
        })();`,
      },
      external: ['vue'],
      plugins: [...presets(filename, targetName, externals), createEnvPlugin('development'), createLisencePlugin()],
      onwarn,
    },
    {
      input: 'src/index.ts',
      output: {
        format: 'umd',
        file: `dist/${filename}.umd.production.js`,
        name: targetName,
        sourcemap,
        exports: 'named',
        amd: {
          id: filename,
        },
        intro: `(function(){
          var global = this || self;
          global.globalThis = global;
        })();`,
      },
      external: ['vue'],
      plugins: [
        ...presets(filename, targetName, externals),
        terser(),
        createEnvPlugin('production'),
        createLisencePlugin(),
      ],
      onwarn,
    },
  ];

  if (noUIDtsPackages.includes(filename)) {
    base.push({
      input: 'esm/index.d.ts',
      output: {
        format: 'es',
        file: `dist/${filename}.d.ts`,
      },
      plugins: [dts(), createLisencePlugin()],
    });
    base.push({
      input: 'esm/index.d.ts',
      output: {
        format: 'es',
        file: `dist/${filename}.all.d.ts`,
      },
      plugins: [
        dts({
          respectExternal: true,
          compilerOptions: {
            exclude: ['**/vue/**'],
          },
        }),
        createLisencePlugin(),
      ],
    });
  }

  return base;
};
