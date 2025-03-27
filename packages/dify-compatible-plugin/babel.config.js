module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false, // 对ES6的模块文件不做转化，以便使用tree shaking、sideEffects等
        spec: false,
        forceAllTransforms: true,
        useBuiltIns: 'usage', // 根据使用导入
        corejs: {
          version: 3, // 使用core-js@3
          proposals: false,
        },
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    ['@babel/preset-typescript'],
  ],
  ignore: ['src/*.d.ts'],
};
