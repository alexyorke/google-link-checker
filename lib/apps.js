const { createController, createSlackAdapter, getSigningSecret } = require('./slack_runtime');
const { getTeam, saveTeam } = require('./team_store');

module.exports = {
    configure: function (port, clientId, clientSecret, config, onInstallation) {
        var signingSecret = getSigningSecret();
        var redirectUri = process.env.REDIRECT_URI || process.env.SLACK_REDIRECT_URI || ('http://localhost:' + port + '/install/auth');
        var adapter = createSlackAdapter({
            clientSigningSecret: signingSecret,
            clientId: clientId,
            clientSecret: clientSecret,
            scopes: ['bot'],
            redirectUri: redirectUri,
            getTokenForTeam: async function (teamId) {
                var team = getTeam(teamId);
                return team && team.bot_access_token;
            },
            getBotUserByTeam: async function (teamId) {
                var team = getTeam(teamId);
                return team && team.bot_user_id;
            },
            enable_incomplete: !signingSecret,
        });
        var controller = createController(config, adapter);

        controller.webserver.get('/install', function (req, res) {
            res.redirect(adapter.getInstallLink());
        });

        controller.webserver.get('/install/auth', async function (req, res) {
            try {
                var results = await adapter.validateOauthCode(req.query.code);
                var teamId = results.team_id || (results.team && results.team.id);
                var token = results.access_token || (results.bot && results.bot.bot_access_token);
                var botUserId = results.bot_user_id || (results.bot && results.bot.bot_user_id);

                if (!teamId || !token || !botUserId) {
                    throw new Error('Incomplete OAuth response from Slack');
                }

                saveTeam({
                    id: teamId,
                    bot_access_token: token,
                    bot_user_id: botUserId,
                });

                if (onInstallation) {
                    var bot = await controller.spawn(teamId);
                    await onInstallation(bot);
                }

                res.send('Success!');
            } catch (err) {
                console.error('OAUTH ERROR:', err);
                res.status(401).send(err.message);
            }
        });

        controller.ready(function () {
            console.log('Google Link Checker ready in multi-team mode.');
        });

        return controller;
    }
};
