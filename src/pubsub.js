const { PubSub } = require('graphql-subscriptions');

class PubSubManager {
  constructor() {
    this.pubsub = new PubSub();
  }

  publish(channel, data) {
    return this.pubsub.publish(channel, data);
  }

  subscribe(channel) {
    return this.pubsub.asyncIterator([channel]);
  }

  getAsyncIterator(channels) {
    return this.pubsub.asyncIterator(channels);
  }
}

const pubsubManager = new PubSubManager();
module.exports = pubsubManager;
