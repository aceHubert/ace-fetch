import baseConfig from '../../scripts/rollup.base';

export default baseConfig(
  'index',
  'AceFetch.Graphql',
  {
    '@apollo/client': 'ApolloClient',
  },
  false,
);
