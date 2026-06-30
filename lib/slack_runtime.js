const { Botkit } = require('botkit');
const { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } = require('botbuilder-adapter-slack');

function getSigningSecret() {
    return process.env.SLACK_SIGNING_SECRET || process.env.CLIENT_SIGNING_SECRET || process.env.SLACK_SECRET || process.env.VERIFICATION_TOKEN;
}

function createSlackAdapter(options) {
    var hasVerifier = Boolean(options.verificationToken || options.clientSigningSecret);
    var adapter = new SlackAdapter(Object.assign({}, options, {
        enable_incomplete: options.enable_incomplete || !hasVerifier,
    }));

    adapter.use(new SlackEventMiddleware());
    adapter.use(new SlackMessageTypeMiddleware());

    return adapter;
}

function createController(config, adapter) {
    return new Botkit(Object.assign({}, config, {
        adapter: adapter,
    }));
}

module.exports = {
    createController: createController,
    createSlackAdapter: createSlackAdapter,
    getSigningSecret: getSigningSecret,
};
