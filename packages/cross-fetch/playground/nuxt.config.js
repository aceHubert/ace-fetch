const path = require('path');

module.exports = () => {
  return {
    ssr: false,
    plugins: ['plugins/bootstrap'],
    buildModules: ['@nuxt/typescript-build', '@nuxtjs/composition-api/module'],
    build: {
      transpile: ['@ace-fetch/core'],
    },
  };
};
