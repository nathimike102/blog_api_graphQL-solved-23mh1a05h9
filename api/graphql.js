const { ApolloServer } = require('apollo-server-micro');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const Cors = require('micro-cors');

const typeDefs = require('../src/schema');
const resolvers = require('../src/resolvers');
const { createLoaders } = require('../src/loaders');
const { getTokenFromHeader } = require('../src/auth');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const apolloServer = new ApolloServer({
  schema,
  context: async ({ req }) => {
    const authHeader = req?.headers?.authorization;
    return {
      loaders: createLoaders(),
      authHeader,
    };
  },
  formatError: (error) => {
    console.error('[GraphQL Error]', error);
    return error;
  },
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
});

const startServer = apolloServer.start();

const cors = Cors({
  origin: process.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});

module.exports = cors(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
});

exports.config = {
  api: {
    bodyParser: false,
  },
};
