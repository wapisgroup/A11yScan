// worker/create_topic.js
const { PubSub } = require('@google-cloud/pubsub');

async function main() {
    const topicName = process.env.PUBSUB_TOPIC || 'a11yscan-jobs';
    const subName = process.env.PUBSUB_SUB || 'a11yscan-worker-sub';
    const projectId = process.env.GCLOUD_PROJECT || 'local-project';

    // When PUBSUB_EMULATOR_HOST is set the client will connect to emulator
    const options = {};
    if (process.env.PUBSUB_EMULATOR_HOST) {
        // apiEndpoint expects host:port (no protocol)
        options.apiEndpoint = process.env.PUBSUB_EMULATOR_HOST;
        options.projectId = projectId;
    }
    const pubsub = new PubSub(options);

    // create topic if missing
    const [topics] = await pubsub.getTopics();
    const exists = topics.some(t => t.name.endsWith(`/topics/${topicName}`));
    if (!exists) {
        console.log('Creating topic', topicName);
        await pubsub.createTopic(topicName);
    } else {
        console.log('Topic exists', topicName);
    }

    // create subscription
    const topic = pubsub.topic(topicName);
    const [subs] = await topic.getSubscriptions();
    const subExists = subs.some(s => s.name.endsWith(`/subscriptions/${subName}`));
    if (!subExists) {
        console.log('Creating subscription', subName);
        await topic.createSubscription(subName, { ackDeadlineSeconds: 60 });
    } else {
        console.log('Subscription exists', subName);
    }

    console.log('Done');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});