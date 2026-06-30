const { createController, createSlackAdapter, getSigningSecret } = require('./slack_runtime');

module.exports = {
    configure: function (token, config, onInstallation) {
        var signingSecret = getSigningSecret();
        var adapter = createSlackAdapter({
            botToken: token,
            clientSigningSecret: signingSecret,
            enable_incomplete: !signingSecret,
        });
        var controller = createController(config, adapter);

        controller.ready(function () {
            console.log('Google Link Checker ready in single-team mode.');
        });

        return controller;
    }
};
