import baseConfig from '../../scripts/rollup.base';

export default baseConfig(
  'index',
  'AceFetch.Axios',
  {
    axios: 'axios',
  },
  false,
);
