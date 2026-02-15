require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const subscriptionResolvers = require('./subscriptionResolvers');
const { createLoaders } = require('./loaders');
const { getTokenFromHeader } = require('./auth');
const pubsub = require('./pubsub');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.redirect(302, '/graphql');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/graphql/schema', (_req, res) => {
  const schema = require('./schema');
  res.type('text/plain').send(schema.loc.source.body);
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: [resolvers, subscriptionResolvers],
});

const server = new ApolloServer({
  schema,
  cache: 'bounded',
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        pubsub: pubsub.pubsub,
        loaders: createLoaders(),
        authHeader: connection.connectionParams?.authToken ? `Bearer ${connection.connectionParams.authToken}` : null,
      };
    }
    const authHeader = req?.headers?.authorization;
    return {
      pubsub: pubsub.pubsub,
      loaders: createLoaders(),
      authHeader,
    };
  },
  formatError: (error) => {
    console.error('[GraphQL Error]', error);
    return error;
  },
  introspection: true,
});

async function startServer() {
  await server.start();

  server.applyMiddleware({
    app,
    path: '/graphql',
    cors: { credentials: true, origin: process.env.CORS_ORIGIN || '*' },
  });

  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  useServer(
    {
      schema,
      context: async (ctx, msg, args) => {
        const token = ctx.connectionParams?.authToken;
        return {
          pubsub: pubsub.pubsub,
          loaders: createLoaders(),
          authHeader: token ? `Bearer ${token}` : null,
        };
      },
    },
    wsServer
  );

  httpServer.listen(PORT, () => {
    console.log(`[Server] GraphQL API listening at http://localhost:${PORT}/graphql`);
    console.log(`[Server] WebSocket subscriptions at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
