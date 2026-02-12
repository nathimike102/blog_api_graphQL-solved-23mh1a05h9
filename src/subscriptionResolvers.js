const pubsub = require('./pubsub');

const subscriptionResolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.getAsyncIterator(['POST_CREATED']),
    },

    commentAdded: {
      subscribe: (_parent, args) => {
        const channel = `COMMENT_ADDED_${args.postId}`;
        return pubsub.getAsyncIterator([channel]);
      },
    },
  },
};

module.exports = subscriptionResolvers;
